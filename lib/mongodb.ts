import { MongoClient, MongoClientOptions, Db, Collection } from "mongodb";
import { Recipe } from "../types/Recipe";
import { User } from "../types/User";
import { Archive } from "../types/Archive";
import { Invitation } from "../types/Invitation";

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
  invitations: Collection<Invitation>;
}> {
  const client = await clientPromise;
  const db = client.db("recipesDB");

  // Create TTL index for invitations collection if it doesn't exist
  const invitationsCollection = db.collection<Invitation>("invitations");
  await invitationsCollection.createIndexes([
    {
      key: { expiresAt: 1 },
      expireAfterSeconds: 0,
      name: "TTL_index"
    },
    {
      key: { email: 1 },
      name: "email_index"
    },
    {
      key: { token: 1 },
      unique: true,
      name: "token_unique_index"
    },
    {
      key: { status: 1 },
      name: "status_index"
    }
  ]);

  return {
    client,
    db,
    recipes: db.collection<Recipe>("recipes"),
    users: db.collection<User>("users"),
    archives: db.collection<Archive>("archives"),
    invitations: invitationsCollection,
  };
}