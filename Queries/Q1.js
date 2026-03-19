const { MongoClient } = require("mongodb");

const URI = "mongodb://localhost:27017";
const DB   = "ieeevisTweets";
const COL  = "tweet";

async function run() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const collection = client.db(DB).collection(COL);

    const count = await collection.countDocuments({
      retweeted_status:      { $exists: false },
      in_reply_to_status_id: null,
    });

    console.log(`Tweets that are NOT retweets or replies: ${count}`);
  } finally {
    await client.close();
  }
}

run().catch(console.error);