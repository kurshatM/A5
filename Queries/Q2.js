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

      // group by user id, keep screen_name and max follower count

      {
        $group: {
          _id:             "$user.id",
          screen_name:     { $first: "$user.screen_name" },
          followers_count: { $max:   "$user.followers_count" },
        },
      },

      // sort by followers (descending)

      { $sort: { followers_count: -1 } },

      // keep only the top 10

      { $limit: 10 },

      // clean up output shape

      {
        $project: {
          _id:             0,
          screen_name:     1,
          followers_count: 1,
        },
      },
    ]).toArray();

    console.log("Top 10 screen_names by followers:");
    results.forEach((u, i) =>
      console.log(`  ${i + 1}. @${u.screen_name} — ${u.followers_count.toLocaleString()} followers`)
    );
  } finally {
    await client.close();
  }
}

run().catch(console.error);
