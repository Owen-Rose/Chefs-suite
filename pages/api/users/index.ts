import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/lib/firebaseAdmin";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const { db } = await connectToDatabase();

    switch (req.method) {
        case 'POST':
            return handleCreateUser(req, res, db);
        case 'GET':
            return handleGetUsers(req, res, db);
        default:
            return res.status(405).end();
    }
};

const handleCreateUser = async (req: NextApiRequest, res: NextApiResponse, db: any) => {
    const { email, password, ...rest } = req.body;

    try {
        const userRecord = await auth.createUser({
            email,
            password,
            ...rest,
        });

        const newUser = {
            uid: userRecord.uid,
            email,
            ...rest,
        };

        await db.collection('users').insertOne(newUser);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const handleGetUsers = async (req: NextApiRequest, res: NextApiResponse, db: any) => {
    try {
        const users = await db.collection('users').find({}).toArray();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export default handler;
