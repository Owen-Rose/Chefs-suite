import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/lib/firebaseAdmin";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const { db } = await connectToDatabase();
    const { id } = req.query;

    switch (req.method) {
        case 'GET':
            return handleGetUser(req, res, db, id as string);
        case 'PUT':
            return handleUpdateUser(req, res, db, id as string);
        case 'DELETE':
            return handleDeleteUser(req, res, db, id as string);
        default:
            return res.status(405).end();
    }
};

const handleGetUser = async (req: NextApiRequest, res: NextApiResponse, db: any, id: string) => {
    try {
        const user = await db.collection('users').findOne({ _id: id });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

const handleUpdateUser = async (req: NextApiRequest, res: NextApiResponse, db: any, id: string) => {
    const { email, password, ...rest } = req.body;

    try {
        const updatedUser = await auth.updateUser(id, {
            email,
            password,
            ...rest,
        });

        const updateResult = await db.collection('users').updteOne(
            { _id: id },
            { $set: { email, ...rest } },
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const handleDeleteUser = async (req: NextApiRequest, res: NextApiResponse, db: any, id: string) => {
    try {
        const deleteResult = await db.collection('users').deleteOne({ _id: id });

        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

export default handler;