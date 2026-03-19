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
      // count how many tweets each user authored
      {
        $group: {
          _id:         "$user.screen_name",
          tweet_count: { $sum: 1 },
        },
      },
      // sort descending
      // grab the top result
      { $sort:  { tweet_count: -1 } },
      { $limit: 1 },
    ]).toArray();

    if (results.length) {
      const { _id: screen_name, tweet_count } = results[0];
      console.log(`Most prolific tweeter: @${screen_name} with ${tweet_count} tweets`);
    } else {
      console.log("No tweets found.");
    }
  } finally {
    await client.close();
  }
}

run().catch(console.error);
