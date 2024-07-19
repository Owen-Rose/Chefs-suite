import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
    const client = await clientPromise;
    const db = client.db();

    const recipes = await db.collection('recipes').find({}).toArray();

    res.json(recipes);
}
