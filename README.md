# IEEE Vis Tweets MongoDB Assignment

A Node.js application that analyzes IEEE Vis conference tweets stored in MongoDB. The project contains five analytical queries that explore tweet metrics, user engagement, and data normalization.

## Project Overview

This assignment demonstrates MongoDB aggregation pipelines and data transformation techniques using a dataset of IEEE Vis tweets. The queries range from simple counting operations to complex multi-stage aggregations.

## Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (running on `localhost:27017`)
- **Database**: `ieeevisTweets` with `tweet` collection

## Installation

1. Install project dependencies:

```bash
npm install
```

This will install MongoDB driver v6.16.0.

## Database Setup

Ensure MongoDB is running and contains:
- Database: `ieeevisTweets`
- Collection: `tweet` (primary data source)

The queries will automatically create output collections as needed.

## Available Queries

### Query 1: Original Tweets Count

**File**: `Queries/Q1.js`

Counts tweets that are neither retweets nor replies (original content only).

```bash
npm run q1
```

**Output**: Total count of original tweets

---

### Query 2: Top 10 Most Followed Users

**File**: `Queries/Q2.js`

Identifies the 10 users with the highest follower counts from the tweet dataset.

**Process**:
1. Groups tweets by `user.id`
2. Extracts `screen_name` and max `followers_count` for each user
3. Sorts by followers in descending order
4. Limits to top 10 results

```bash
npm run q2
```

**Output**: Ranked list of top 10 users with follower counts

---

### Query 3: Most Prolific Tweeter

**File**: `Queries/Q3.js`

Finds the user who authored the most tweets in the dataset.

**Process**:
1. Groups all tweets by `user.screen_name`
2. Counts tweets per user
3. Sorts by tweet count descending
4. Returns the top result

```bash
npm run q3
```

**Output**: Screen name and total tweet count of the most active user

---

### Query 4: Top 10 Users by Average Retweets

**File**: `Queries/Q4.js`

Ranks users with at least 4+ tweets by their average retweet count.

**Process**:
1. Groups tweets by `user.screen_name`
2. Calculates tweet count and average `retweet_count` per user
3. Filters users with more than 3 tweets
4. Sorts by average retweets descending
5. Limits to top 10 and formats output

```bash
npm run q4
```

**Output**: Ranked list of users with their average retweet metrics

---

### Query 5: Data Normalization Pipeline

**File**: `Queries/Q5.js`

Normalizes the tweet dataset by separating user information from tweet content, creating properly structured normalized collections for efficient querying.

**Process**:

**Step 1 - Collection Cleanup**: Drops existing `users` and `tweets_only` collections for idempotency

**Step 2 - User Deduplication**: 
- Groups tweets by unique `user.id`
- Extracts first user object occurrence per user
- Promotes user data to document root
- Sets MongoDB `_id` to Twitter user ID
- Writes to `users` collection

**Step 3 - Tweet Denormalization**:
- Extracts `user.id` as lightweight `user_id` field
- Removes embedded `user` object to reduce storage
- Maintains referential integrity for joins
- Writes to `tweets_only` collection

**Step 4 - Validation**:
- Performs `$lookup` join between `tweets_only` and `users` collections
- Displays 3 sample tweets with reconstructed user information
- Confirms successful normalization and referential relationships

```bash
npm run q5
```

**Output**: 
- Count of unique users created
- Count of normalized tweets
- Sample join results demonstrating data reconstruction

## Project Structure

```
assign5/
├── Queries/
│   ├── Q1.js          # Original tweets count query
│   ├── Q2.js          # Top followers query
│   ├── Q3.js          # Most prolific tweeter query
│   ├── Q4.js          # Top by average retweets query
│   └── Q5.js          # Data normalization pipeline
├── package.json       # Project dependencies and scripts
├── README.md          # This file
└── LICENSE            # Project license
```

## Technical Details

### MongoDB Connection
- **URI**: `mongodb://localhost:27017`
- **Database**: `ieeevisTweets`
- **Primary Collection**: `tweet`

### Data Schema

The `tweet` collection contains documents with the structure:
```javascript
{
  _id: ObjectId,
  text: String,
  user: {
    id: Number,
    screen_name: String,
    name: String,
    followers_count: Number,
    ...
  },
  retweet_count: Number,
  retweeted_status: Object (optional),
  in_reply_to_status_id: Number (optional),
  ...
}
```

### Output Collections (Q5)

**users collection**:
```javascript
{
  _id: Number,           // Twitter user ID
  screen_name: String,
  name: String,
  followers_count: Number,
  ...
}
```

**tweets_only collection**:
```javascript
{
  _id: ObjectId,
  text: String,
  user_id: Number,       // Foreign key reference
  retweet_count: Number,
  ...
}
```

## Error Handling

All queries implement try-catch-finally patterns to ensure database connections are properly closed. Error messages are logged to stderr.

```bash
npm run q1  # If MongoDB is offline, error will be displayed
```

## Running All Queries

Execute queries individually using the npm scripts above, or extend the `package.json` scripts to run multiple queries sequentially.

## Notes

- Queries are designed to be idempotent (Q5 drops and recreates collections)
- All timestamps and connections use MongoDB's native driver
- Aggregation pipelines are optimized for readability with inline documentation
- Output includes proper formatting and localized number display

## License

See LICENSE file for details.


## AI Disclosure:

Used Github Copilot to write readme

Prompt: Write readme

