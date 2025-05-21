import { MongoClient, Collection, ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '@/types/User';
import { UserRole } from '@/types/Roles';
import { MongoUserRepository } from '@/repositories/implementations/MongoUserRepository';
import { ListResult } from '@/repositories/base/types';

// Mock user data for testing
const mockUsers: Omit<User, '_id'>[] = [
  {
    FirstName: 'John',
    LastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashed_password_1',
    role: UserRole.CHEF,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    FirstName: 'Jane',
    LastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'hashed_password_2',
    role: UserRole.MANAGER,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  }
];

describe('MongoUserRepository', () => {
  let mongoServer: MongoMemoryServer;
  let mongoClient: MongoClient;
  let collection: Collection<User>;
  let repository: MongoUserRepository;
  let insertedIds: ObjectId[] = [];

  beforeAll(async () => {
    // Start an in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();

    // Set up collection and repository
    const db = mongoClient.db('test-db');
    collection = db.collection<User>('users');
    repository = new MongoUserRepository(collection);
  });

  beforeEach(async () => {
    // Clear the collection before each test
    await collection.deleteMany({});
    insertedIds = [];

    // Insert test data
    const insertResult = await collection.insertMany(mockUsers);
    
    // Store inserted IDs for later use
    insertedIds = Object.values(insertResult.insertedIds);
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  describe('findAll', () => {
    it('should return all users with pagination', async () => {
      // Act
      const result = await repository.findAll();

      // Assert
      expect(result.items.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.items[0].FirstName).toEqual(expect.stringMatching(/John|Jane/));
    });

    it('should respect pagination options', async () => {
      // Insert more users to test pagination
      const moreUsers = Array(8).fill(null).map((_, i) => ({
        ...mockUsers[0],
        _id: new ObjectId(),  // Ensure unique _id
        FirstName: `Test${i + 1}`,
        LastName: `User${i + 1}`,
        email: `test.user${i + 1}@example.com`
      }));
      
      await collection.insertMany(moreUsers);

      // Act
      const result = await repository.findAll({ skip: 2, limit: 3 });

      // Assert
      expect(result.items.length).toBe(3);
      expect(result.total).toBe(10);  // 2 original + 8 new
      expect(result.page).toBe(1);    // Page calculation: Math.floor(skip / limit) + 1
      expect(result.totalPages).toBe(4); // Ceil(10 / 3)
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      // Act
      const result = await repository.findById(insertedIds[0].toString());

      // Assert
      expect(result).not.toBeNull();
      expect(result?._id).toEqual(insertedIds[0]);
    });

    it('should return null for non-existent id', async () => {
      // Act
      const result = await repository.findById(new ObjectId().toString());

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for invalid id', async () => {
      // Act
      const result = await repository.findById('not-valid-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByFilter', () => {
    it('should find users matching a filter', async () => {
      // Act
      const result = await repository.findByFilter({ role: UserRole.MANAGER });

      // Assert
      expect(result.items.length).toBe(1);
      expect(result.items[0].role).toBe(UserRole.MANAGER);
    });

    it('should return empty result for non-matching filter', async () => {
      // Act
      const result = await repository.findByFilter({ role: UserRole.ADMIN });

      // Assert
      expect(result.items.length).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      // Arrange
      const newUser: Omit<User, '_id'> = {
        FirstName: 'New',
        LastName: 'User',
        email: 'new.user@example.com',
        password: 'hashed_password_new',
        role: UserRole.STAFF,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const result = await repository.create(newUser);

      // Assert
      expect(result._id).toBeDefined();
      expect(result.FirstName).toBe(newUser.FirstName);
      expect(result.email).toBe(newUser.email.toLowerCase());
      
      // Verify it was actually inserted in the DB
      const fromDb = await collection.findOne({ _id: result._id });
      expect(fromDb).not.toBeNull();
      expect(fromDb?.FirstName).toBe(newUser.FirstName);
    });

    it('should store email in lowercase', async () => {
      // Arrange
      const newUser: Omit<User, '_id'> = {
        FirstName: 'Case',
        LastName: 'Test',
        email: 'MiXeD.CaSe@example.com',
        password: 'hashed_password_case',
        role: UserRole.STAFF,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const result = await repository.create(newUser);

      // Assert
      expect(result.email).toBe('mixed.case@example.com');
      
      // Verify it was stored in lowercase in the DB
      const fromDb = await collection.findOne({ _id: result._id });
      expect(fromDb?.email).toBe('mixed.case@example.com');
    });
  });

  describe('createMany', () => {
    it('should create multiple users', async () => {
      // Arrange
      const newUsers: Omit<User, '_id'>[] = [
        {
          FirstName: 'Batch1',
          LastName: 'User',
          email: 'batch1@example.com',
          password: 'hashed_password_batch1',
          role: UserRole.CHEF,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          FirstName: 'Batch2',
          LastName: 'User',
          email: 'batch2@example.com',
          password: 'hashed_password_batch2',
          role: UserRole.CHEF,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Act
      const results = await repository.createMany(newUsers);

      // Assert
      expect(results.length).toBe(2);
      expect(results[0]._id).toBeDefined();
      expect(results[1]._id).toBeDefined();
      expect(results[0].FirstName).toBe('Batch1');
      expect(results[1].FirstName).toBe('Batch2');
      
      // Verify they were actually inserted in the DB
      const fromDb = await collection.find({ 
        FirstName: { $in: ['Batch1', 'Batch2'] } 
      }).toArray();
      expect(fromDb.length).toBe(2);
    });

    it('should return empty array when input is empty', async () => {
      // Act
      const results = await repository.createMany([]);

      // Assert
      expect(results).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      // Arrange
      const updateData: Partial<User> = {
        FirstName: 'Updated',
        LastName: 'Name'
      };

      // Act
      const result = await repository.update(insertedIds[0].toString(), updateData);

      // Assert
      expect(result._id).toEqual(insertedIds[0]);
      expect(result.FirstName).toBe(updateData.FirstName);
      expect(result.LastName).toBe(updateData.LastName);
      
      // Verify it was actually updated in the DB
      const fromDb = await collection.findOne({ _id: insertedIds[0] });
      expect(fromDb?.FirstName).toBe(updateData.FirstName);
    });

    it('should update email to lowercase', async () => {
      // Arrange
      const updateData: Partial<User> = {
        email: 'UPDATED.EMAIL@example.com'
      };

      // Act
      const result = await repository.update(insertedIds[0].toString(), updateData);

      // Assert
      expect(result.email).toBe('updated.email@example.com');
      
      // Verify it was stored in lowercase in the DB
      const fromDb = await collection.findOne({ _id: insertedIds[0] });
      expect(fromDb?.email).toBe('updated.email@example.com');
    });

    it('should throw error for invalid id', async () => {
      // Act & Assert
      await expect(repository.update('invalid-id', { FirstName: 'Test' }))
        .rejects.toThrow('Invalid user ID');
    });

    it('should throw error for non-existent id', async () => {
      // Act & Assert
      await expect(repository.update(new ObjectId().toString(), { FirstName: 'Test' }))
        .rejects.toThrow('User not found');
    });
  });

  describe('upsert', () => {
    it('should update existing document when found', async () => {
      // Arrange
      const filter = { _id: insertedIds[0] };
      const updateData: Partial<User> = { FirstName: 'Upserted' };

      // Act
      const result = await repository.upsert(filter, updateData);

      // Assert
      expect(result._id).toEqual(insertedIds[0]);
      expect(result.FirstName).toBe(updateData.FirstName);
    });

    it('should insert new document when not found', async () => {
      // Arrange
      const filter = { email: 'non-existent@example.com' };
      const upsertData: Partial<User> = {
        FirstName: 'New',
        LastName: 'User',
        email: 'non-existent@example.com',
        password: 'hashed_password_new',
        role: UserRole.STAFF
      };

      // Act
      const result = await repository.upsert(filter, upsertData);

      // Assert
      expect(result._id).toBeDefined();
      expect(result.FirstName).toBe(upsertData.FirstName);
      
      // Verify it was actually inserted in the DB
      const fromDb = await collection.findOne({ email: 'non-existent@example.com' });
      expect(fromDb).not.toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing user', async () => {
      // Act
      await repository.delete(insertedIds[0].toString());

      // Assert - verify it was actually deleted from the DB
      const fromDb = await collection.findOne({ _id: insertedIds[0] });
      expect(fromDb).toBeNull();
    });

    it('should throw error for invalid id', async () => {
      // Act & Assert
      await expect(repository.delete('invalid-id'))
        .rejects.toThrow('Invalid user ID');
    });

    it('should throw error for non-existent id', async () => {
      // Act & Assert
      await expect(repository.delete(new ObjectId().toString()))
        .rejects.toThrow('User not found');
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple users matching filter', async () => {
      // Arrange - Add some users with the same role
      await collection.insertMany([
        {
          ...mockUsers[0],
          _id: new ObjectId(),
          role: UserRole.PASTRY_CHEF
        },
        {
          ...mockUsers[1],
          _id: new ObjectId(),
          role: UserRole.PASTRY_CHEF
        }
      ]);

      // Act
      const deleteCount = await repository.deleteMany({ role: UserRole.PASTRY_CHEF });

      // Assert
      expect(deleteCount).toBe(2);
      
      // Verify they were actually deleted from the DB
      const fromDb = await collection.find({ role: UserRole.PASTRY_CHEF }).toArray();
      expect(fromDb.length).toBe(0);
    });

    it('should return 0 when no users match filter', async () => {
      // Act
      const deleteCount = await repository.deleteMany({ role: UserRole.ADMIN });

      // Assert
      expect(deleteCount).toBe(0);
    });
  });

  describe('count', () => {
    it('should count users matching filter', async () => {
      // Act
      const count = await repository.count({ role: UserRole.CHEF });

      // Assert
      expect(count).toBe(1);
    });

    it('should count all users when no filter provided', async () => {
      // Act
      const count = await repository.count();

      // Assert
      expect(count).toBe(2);
    });
  });

  describe('exists', () => {
    it('should return true for existing user', async () => {
      // Act
      const exists = await repository.exists(insertedIds[0].toString());

      // Assert
      expect(exists).toBe(true);
    });

    it('should return false for non-existing user', async () => {
      // Act
      const exists = await repository.exists(new ObjectId().toString());

      // Assert
      expect(exists).toBe(false);
    });

    it('should return false for invalid id', async () => {
      // Act
      const exists = await repository.exists('invalid-id');

      // Assert
      expect(exists).toBe(false);
    });
  });

  describe('User-specific methods', () => {
    it('should find a user by email', async () => {
      // Act
      const result = await repository.findByEmail('john.doe@example.com');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.FirstName).toBe('John');
    });

    it('should find a user by email case-insensitively', async () => {
      // Act
      const result = await repository.findByEmail('JOHN.DOE@example.com');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.FirstName).toBe('John');
    });

    it('should return null for non-existent email', async () => {
      // Act
      const result = await repository.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });

    it('should check if email exists', async () => {
      // Act
      const exists = await repository.emailExists('john.doe@example.com');

      // Assert
      expect(exists).toBe(true);
    });

    it('should check if email exists case-insensitively', async () => {
      // Act
      const exists = await repository.emailExists('JOHN.DOE@example.com');

      // Assert
      expect(exists).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      // Act
      const exists = await repository.emailExists('nonexistent@example.com');

      // Assert
      expect(exists).toBe(false);
    });

    it('should update user password', async () => {
      // Arrange
      const newPassword = 'new_hashed_password';

      // Act
      const result = await repository.updatePassword(insertedIds[0].toString(), newPassword);

      // Assert
      expect(result.password).toBe(newPassword);
      
      // Verify it was actually updated in the DB
      const fromDb = await collection.findOne({ _id: insertedIds[0] });
      expect(fromDb?.password).toBe(newPassword);
    });
  });
});