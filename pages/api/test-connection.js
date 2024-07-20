// pages/api/test-connection.js

import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  try {
    console.log("Connecting to MongoDB...");
    const client = await clientPromise;
    console.log("Connected to MongoDB");

    const db = client.db();
    const recipe = await db.collection("recipes").findOne();

    if (!recipe) {
      console.log("No recipe found");
      return res.status(200).json(null);
    }

    console.log("Fetched recipe:", recipe);
    res.status(200).json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
}
