import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  try {
    console.log("Connecting to MongoDB...");
    const client = await clientPromise;
    console.log("Connected to MongoDB");

    const db = client.db("recipesDB"); // Ensure you are using the correct database name
    console.log("Using database:", db.databaseName);

    const recipes = await db.collection("recipes").find({}).toArray(); // Ensure you are using the correct collection name
    console.log("Fetched recipes:", recipes);

    res.status(200).json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
}
