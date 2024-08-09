import { MongoClient, MongoClientOptions } from "mongodb";

const uri: string = process.env.MONGODB_URI!;
const options: MongoClientOptions = {};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export { clientPromise };

export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db("recipesDB");
  return {
    db,
    recipes: db.collection("recipes"),
    users: db.collection("users"),
    archives: db.collection("archives"), // New collection for archives
  };
}
