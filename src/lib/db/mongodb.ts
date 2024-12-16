import { MongoClient, MongoClientOptions, Db, Collection } from "mongodb";
import { Recipe, User, Archive } from "@/types";

/**
 * MongoDB connection URI from environment variables
 * @type {string}
 */
const uri = process.env.MONGODB_URI!;

/**
 * MongoDB client options
 * @type {MongoClientOptions}
 */
const options: MongoClientOptions = {};

/**
 * Global type declaration for the MongoDB client promise
 */
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Cached MongoDB client instance
 */
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

/**
 * In development mode we use a global variable to preserve the value
 * across module reloads caused by HMR (Hot Module Replacement).
 */
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export { clientPromise };

/**
 * Connects to MongoDB and returns database and collection instances
 * @returns {Promise<{
 *   client: MongoClient,
 *   db: Db,
 *   recipes: Collection<Recipe>,
 *   users: Collection<User>,
 *   archives: Collection<Archive>
 * }>}
 */
export async function connectToDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "recipesDB");

    return {
      client,
      db,
      recipes: db.collection<Recipe>("recipes"),
      users: db.collection<User>("users"),
      archives: db.collection<Archive>("archives"),
    };
  } catch (error) {
    console.error("Failed to connect to database:", error);
    throw new Error("Database connection failed");
  }
}

/**
 * Helper function to safely close the database connection
 * @param {MongoClient} client - MongoDB client instance
 */
export async function closeConnection(client: MongoClient) {
  try {
    await client.close();
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
}
