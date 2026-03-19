const { MongoClient } = require("mongodb");

const URI = "mongodb://localhost:27017";
const DB   = "ieeevisTweets";
const COL  = "tweet";

async function run() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const collection = client.db(DB).collection(COL);

    const results = await collection.aggregate([
      // accumulate tweet count and average retweet_count
      {
        $group: {
          _id:            "$user.screen_name",
          tweet_count:    { $sum: 1 },
          avg_retweets:   { $avg: "$retweet_count" },
        },
      },
      // keep only users who tweeted more than 3 times
      { $match: { tweet_count: { $gt: 3 } } },
      // sort by average retweets descending
      { $sort: { avg_retweets: -1 } },
      // top 10 only
      { $limit: 10 },
      // clean up output shape and round avg_retweets to 2 decimal places
      {
        $project: {
          _id:          0,
          screen_name:  "$_id",
          tweet_count:  1,
          avg_retweets: { $round: ["$avg_retweets", 2] },
        },
      },
    ]).toArray();

    console.log("Top 10 by average retweets (>3 tweets authored):");
    results.forEach((u, i) =>
      console.log(
        `  ${i + 1}. @${u.screen_name} — avg retweets: ${u.avg_retweets} (${u.tweet_count} tweets)`
      )
    );
  } finally {
    await client.close();
  }
}

run().catch(console.error);
