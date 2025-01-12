import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient, Db } from 'mongodb'
import { Recipe } from '@/types/Recipe'
import { User } from '@/types/User';
import { Archive } from '@/types/Archive';
import { Invitation } from '@/types/Invitation';
import recipes from '@/pages/api/recipes';

let mongoServer: MongoMemoryServer;
let mongoClient: MongoClient;
let db: Db;

export async function setupTestDatabase() {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    mongoClient = await MongoClient.connect(mongoUri);
    db = mongoClient.db('test');

    await Promise.all([
        db.createCollection('recipes'),
        db.createCollection('users'),
        db.createCollection('archives'),
        db.createCollection('invitations')
    ]);

    const invitationsCollection = db.collection<Invitation>('invitations');
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
        }
    ]);

    return {
        client: mongoClient,
        db,
        recipes: db.collection<Recipe>('recipes'),
        users: db.collection<User>('users'),
        archives: db.collection<Archive>('archives'),
        invitations: invitationsCollection
    };
}

export async function clearTestDatabase() {
    if (db) {
        // Instead of dropping the database, clear collections while preserving indexes
        const collections = await db.collections();
        await Promise.all(collections.map(collection => collection.deleteMany({})));
    }
}

export async function teardownTestDatabase() {
    if (mongoClient) {
        await mongoClient.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
}