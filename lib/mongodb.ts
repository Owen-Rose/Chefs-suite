import { MongoClient, MongoClientOptions, Db, Collection } from "mongodb";
import { Recipe } from "../types/Recipe"; // You'll need to create this type
import { User } from "../types/User"; // You'll need to create this type
import { Archive } from "../types/Archive"; // You'll need to create this type

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

export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
  recipes: Collection<Recipe>;
  users: Collection<User>;
  archives: Collection<Archive>;
}> {
  const client = await clientPromise;
  const db = client.db("recipesDB");
  return {
    client,
    db,
    recipes: db.collection<Recipe>("recipes"),
    users: db.collection<User>("users"),
    archives: db.collection<Archive>("archives"),
  };
}
