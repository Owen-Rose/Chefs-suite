import { ObjectId } from 'mongodb';

// Mock for MongoDB client and database
export const mockDb = {
  collection: jest.fn().mockReturnValue({
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue(0),
    }),
    insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    insertMany: jest.fn().mockResolvedValue({ insertedIds: [new ObjectId(), new ObjectId()] }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    countDocuments: jest.fn().mockResolvedValue(0),
  }),
  command: jest.fn().mockResolvedValue({ ok: 1 }),
};

export const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

export const mockClient = {
  db: jest.fn().mockReturnValue(mockDb),
  startSession: jest.fn().mockReturnValue(mockSession),
  connect: jest.fn(),
  close: jest.fn(),
};

// Mock for MongoDB connection module
jest.mock('../../lib/mongodb', () => ({
  getMongoClient: jest.fn().mockResolvedValue(mockClient),
  getDb: jest.fn().mockResolvedValue(mockDb),
}));