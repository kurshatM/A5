const { MongoClient } = require("mongodb");

const URI = "mongodb://localhost:27017";
const DB   = "ieeevisTweets";

async function run() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const db = client.db(DB);

    const tweetCol     = db.collection("tweet");
    const userCol      = db.collection("users");
    const tweetsOnlyCol = db.collection("tweets_only");

    // clean up target coleluctions
    // drop existing collections if they exsst, catch exceptions for first-time execution
    await userCol.drop().catch(() => {});
    await tweetsOnlyCol.drop().catch(() => {});

    // normalize and deduplicate user data into a separate collection
    // use aggregation pipeline: group by user.id to exgtradt unique users, then persist to 'users' collection
    await tweetCol.aggregate([
      {
        // group documents by unique user.id and extract first occurrence of user object
        // this deduplicates users since multiple tweets can reference the same user
        $group: {
          _id: "$user.id",
          user: { $first: "$user" },
        },
      },
      {
        // promote nested user object to document root for cleaner structure
        // transforms {_id: <user_id>, user: {...}} to {..., _id: <old_id>}
        $replaceRoot: { newRoot: "$user" },
      },
      {
        // set MongoDB's _id to the Twitter user ID for proper primary key relationships
        // this ensures tweets_only can reference users via user_id -> _id join
        $addFields: { _id: "$id" },
      },
      {
        // persist aggregation results into new 'users' collection
        $out: "users"
      },
    ]).toArray();

    const userCount = await userCol.countDocuments();
    console.log(`✔  users collection created — ${userCount} unique users`);

    // denormalize tweets by extracting user references and removing embedded user objects
    // transform tweets_only collection: replace heavy user subdocument with lightweight user_id field
    await tweetCol.aggregate([
      {
        // extract the numeric user ID from nested user.id field
        // creates a foreign key reference for later $lookup joins with users collection
        $addFields: {
          user_id: "$user.id",
        },
      },
      {
        // remove the entire user subdocument to reduce storage and improve query performance
        // minimizes document size while maintaining referential integrity via user_id
        $unset: "user",
      },
      {
        // write transformed documents into tweets_only collection
        $out: "tweets_only"
      },
    ]).toArray();

    const tweetCount = await tweetsOnlyCol.countDocuments();
    console.log(`✔  tweets_only collection created — ${tweetCount} tweets`);

    // validate normalization by executing a cross-collection join query
    // demonstrates referential integrity: retrieve tweets with reconstructed user data w/ $lookup
    console.log("\nSample lookup (tweets_only ⟶ users):");
    const samples = await tweetsOnlyCol.aggregate([
      {
        // limit to 3 documents for sampling purposes
        $limit: 3
      },
      {
        // preform left outer join from tweets_only to users collection
        // matches tweets_only.uesr_id with users._id and populates user_info array
        $lookup: {
          from:         "users",
          localField:   "user_id",
          foreignField: "_id",
          as:           "user_info",
        },
      },
      {
        // deconstruct user_info array to single object (enforce 1:1 relationship via $unwind)
        // transforms array field into separate documents for output formatting
        $unwind: "$user_info"
      },
      {
        // project only relevant fields for display verification
        // confirms successful join by showing tweet ID, user ID, and user profile data
        $project: {
          _id:                  1,
          text:                 1,
          user_id:              1,
          "user_info.screen_name": 1,
          "user_info.name":        1,
        },
      },
    ]).toArray();

    samples.forEach((t) =>
      // display tweet references with corresponding user information showing successful data reconstruction
      console.log(
        `  tweet _id: ${t._id} | user_id: ${t.user_id} ` +
        `| @${t.user_info.screen_name} (${t.user_info.name})`
      )
    );

  } finally {
    // database connection must be closed regardless of success or failure
    await client.close();
  }
}

run().catch(console.error);