import { MongoClient, Collection, ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Archive } from '@/types/Archive';
import { Recipe } from '@/types/Recipe';
import { MongoArchiveRepository } from '@/repositories/implementations/MongoArchiveRepository';
import { ListResult } from '@/repositories/base/types';

// Mock archive data for testing
const mockRecipe1: Omit<Recipe, '_id'> & { archivedDate: Date; originalId: ObjectId } = {
  name: 'Test Recipe 1',
  createdDate: new Date('2023-01-01').toISOString(),
  version: '1.0',
  station: 'Kitchen',
  batchNumber: 1,
  equipment: ['Mixer', 'Oven'],
  ingredients: [
    { id: 1, productName: 'Flour', quantity: 2, unit: 'cups' },
    { id: 2, productName: 'Sugar', quantity: 1, unit: 'cup' }
  ],
  yield: '4 servings',
  portionSize: 'Medium',
  portionsPerRecipe: '4',
  procedure: ['Mix ingredients', 'Bake at 350F for 25 minutes'],
  description: 'A test recipe',
  archivedDate: new Date('2023-01-15'),
  originalId: new ObjectId()
};

const mockRecipe2: Omit<Recipe, '_id'> & { archivedDate: Date; originalId: ObjectId } = {
  name: 'Test Recipe 2',
  createdDate: new Date('2023-01-05').toISOString(),
  version: '1.0',
  station: 'Bakery',
  batchNumber: 2,
  equipment: ['Mixer'],
  ingredients: [
    { id: 3, productName: 'Chocolate', quantity: 200, unit: 'g' },
    { id: 4, productName: 'Butter', quantity: 100, unit: 'g' }
  ],
  yield: '8 servings',
  portionSize: 'Small',
  portionsPerRecipe: '8',
  procedure: ['Melt chocolate', 'Mix with butter', 'Refrigerate'],
  description: 'Another test recipe',
  archivedDate: new Date('2023-01-20'),
  originalId: new ObjectId()
};

const mockUserId1 = new ObjectId();
const mockUserId2 = new ObjectId();

const mockArchives: Omit<Archive, '_id'>[] = [
  {
    name: 'Dessert Archive',
    description: 'Collection of dessert recipes',
    createdDate: new Date('2023-01-01'),
    lastModifiedDate: new Date('2023-01-20'),
    createdBy: mockUserId1,
    recipes: [mockRecipe1]
  },
  {
    name: 'Pastry Archive',
    description: 'Collection of pastry recipes',
    createdDate: new Date('2023-01-10'),
    lastModifiedDate: new Date('2023-01-25'),
    createdBy: mockUserId2,
    recipes: [mockRecipe2]
  }
];

describe('MongoArchiveRepository', () => {
  let mongoServer: MongoMemoryServer;
  let mongoClient: MongoClient;
  let collection: Collection<Archive>;
  let repository: MongoArchiveRepository;
  let insertedIds: ObjectId[] = [];

  beforeAll(async () => {
    // Start an in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();

    // Set up collection and repository
    const db = mongoClient.db('test-db');
    collection = db.collection<Archive>('archives');
    repository = new MongoArchiveRepository(collection);
  });

  beforeEach(async () => {
    // Clear the collection before each test
    await collection.deleteMany({});
    insertedIds = [];

    // Insert test data
    const insertResult = await collection.insertMany(mockArchives);
    
    // Store inserted IDs for later use
    insertedIds = Object.values(insertResult.insertedIds);
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  describe('findAll', () => {
    it('should return all archives with pagination', async () => {
      // Act
      const result = await repository.findAll();

      // Assert
      expect(result.items.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.items[0].name).toEqual(expect.stringMatching(/Dessert Archive|Pastry Archive/));
    });

    it('should respect pagination options', async () => {
      // Insert more archives to test pagination
      const moreArchives = Array(8).fill(null).map((_, i) => ({
        ...mockArchives[0],
        _id: new ObjectId(),
        name: `Test Archive ${i + 1}`,
        description: `Test Description ${i + 1}`
      }));
      
      await collection.insertMany(moreArchives);

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
    it('should find an archive by id', async () => {
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
    it('should find archives matching a filter', async () => {
      // Act
      const result = await repository.findByFilter({ name: 'Dessert Archive' });

      // Assert
      expect(result.items.length).toBe(1);
      expect(result.items[0].name).toBe('Dessert Archive');
    });

    it('should return empty result for non-matching filter', async () => {
      // Act
      const result = await repository.findByFilter({ name: 'Non-Existent Archive' });

      // Assert
      expect(result.items.length).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    it('should create a new archive', async () => {
      // Arrange
      const newArchive: Omit<Archive, '_id'> = {
        name: 'New Archive',
        description: 'A new test archive',
        createdDate: new Date(),
        lastModifiedDate: new Date(),
        createdBy: new ObjectId(),
        recipes: []
      };

      // Act
      const result = await repository.create(newArchive);

      // Assert
      expect(result._id).toBeDefined();
      expect(result.name).toBe(newArchive.name);
      
      // Verify it was actually inserted in the DB
      const fromDb = await collection.findOne({ _id: result._id });
      expect(fromDb).not.toBeNull();
      expect(fromDb?.name).toBe(newArchive.name);
    });

    it('should convert string IDs to ObjectIds', async () => {
      // Arrange
      const userId = new ObjectId();
      const recipeId = new ObjectId();
      
      const newArchive: Omit<Archive, '_id'> = {
        name: 'ID Conversion Test',
        description: 'Testing ID conversion',
        createdDate: new Date(),
        lastModifiedDate: new Date(),
        createdBy: userId.toString() as any, // Passing string instead of ObjectId
        recipes: [
          {
            ...mockRecipe1,
            originalId: recipeId.toString() as any // Passing string instead of ObjectId
          }
        ]
      };

      // Act
      const result = await repository.create(newArchive);

      // Assert
      expect(result.createdBy).toEqual(userId);
      expect(result.recipes[0].originalId).toEqual(recipeId);
    });
  });

  describe('createMany', () => {
    it('should create multiple archives', async () => {
      // Arrange
      const newArchives: Omit<Archive, '_id'>[] = [
        {
          name: 'Batch Archive 1',
          description: 'First batch archive',
          createdDate: new Date(),
          lastModifiedDate: new Date(),
          createdBy: new ObjectId(),
          recipes: []
        },
        {
          name: 'Batch Archive 2',
          description: 'Second batch archive',
          createdDate: new Date(),
          lastModifiedDate: new Date(),
          createdBy: new ObjectId(),
          recipes: []
        }
      ];

      // Act
      const results = await repository.createMany(newArchives);

      // Assert
      expect(results.length).toBe(2);
      expect(results[0]._id).toBeDefined();
      expect(results[1]._id).toBeDefined();
      expect(results[0].name).toBe('Batch Archive 1');
      expect(results[1].name).toBe('Batch Archive 2');
      
      // Verify they were actually inserted in the DB
      const fromDb = await collection.find({ 
        name: { $in: ['Batch Archive 1', 'Batch Archive 2'] } 
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
    it('should update an existing archive', async () => {
      // Arrange
      const updateData: Partial<Archive> = {
        name: 'Updated Archive Name',
        description: 'Updated description'
      };

      // Act
      const result = await repository.update(insertedIds[0].toString(), updateData);

      // Assert
      expect(result._id).toEqual(insertedIds[0]);
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      
      // Verify it was actually updated in the DB
      const fromDb = await collection.findOne({ _id: insertedIds[0] });
      expect(fromDb?.name).toBe(updateData.name);
    });

    it('should update lastModifiedDate when updating', async () => {
      // Setup
      const originalArchive = await collection.findOne({ _id: insertedIds[0] });
      const originalModifiedDate = originalArchive?.lastModifiedDate;
      
      // Check if we have the original date before proceeding
      expect(originalModifiedDate).toBeDefined();
      
      // Wait to ensure date will be different
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Act
      const result = await repository.update(insertedIds[0].toString(), { 
        description: 'Minor update' 
      });

      // Assert
      expect(result.lastModifiedDate).not.toEqual(originalModifiedDate);
      expect(result.lastModifiedDate.getTime()).toBeGreaterThan(
        (originalModifiedDate as Date).getTime()
      );
    });

    it('should throw error for invalid id', async () => {
      // Act & Assert
      await expect(repository.update('invalid-id', { name: 'Test' }))
        .rejects.toThrow('Invalid archive ID');
    });

    it('should throw error for non-existent id', async () => {
      // Act & Assert
      await expect(repository.update(new ObjectId().toString(), { name: 'Test' }))
        .rejects.toThrow('Archive not found');
    });
  });

  describe('upsert', () => {
    it('should update existing document when found', async () => {
      // Arrange
      const filter = { _id: insertedIds[0] };
      const updateData: Partial<Archive> = { name: 'Upserted Archive' };

      // Act
      const result = await repository.upsert(filter, updateData);

      // Assert
      expect(result._id).toEqual(insertedIds[0]);
      expect(result.name).toBe(updateData.name);
    });

    it('should insert new document when not found', async () => {
      // Arrange
      const filter = { name: 'Non-existent Archive' };
      const upsertData: Partial<Archive> = {
        name: 'Non-existent Archive',
        description: 'Newly created via upsert',
        createdBy: new ObjectId()
      };

      // Act
      const result = await repository.upsert(filter, upsertData);

      // Assert
      expect(result._id).toBeDefined();
      expect(result.name).toBe(upsertData.name);
      expect(result.createdDate).toBeDefined();
      expect(result.lastModifiedDate).toBeDefined();
      expect(result.recipes).toEqual([]);
      
      // Verify it was actually inserted in the DB
      const fromDb = await collection.findOne({ name: 'Non-existent Archive' });
      expect(fromDb).not.toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing archive', async () => {
      // Act
      await repository.delete(insertedIds[0].toString());

      // Assert - verify it was actually deleted from the DB
      const fromDb = await collection.findOne({ _id: insertedIds[0] });
      expect(fromDb).toBeNull();
    });

    it('should throw error for invalid id', async () => {
      // Act & Assert
      await expect(repository.delete('invalid-id'))
        .rejects.toThrow('Invalid archive ID');
    });

    it('should throw error for non-existent id', async () => {
      // Act & Assert
      await expect(repository.delete(new ObjectId().toString()))
        .rejects.toThrow('Archive not found');
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple archives matching filter', async () => {
      // Arrange - Add some archives with the same createdBy
      const commonUserId = new ObjectId();
      await collection.insertMany([
        {
          ...mockArchives[0],
          _id: new ObjectId(),
          createdBy: commonUserId,
          name: 'Delete Test 1'
        },
        {
          ...mockArchives[1],
          _id: new ObjectId(),
          createdBy: commonUserId,
          name: 'Delete Test 2'
        }
      ]);

      // Act
      const deleteCount = await repository.deleteMany({ createdBy: commonUserId });

      // Assert
      expect(deleteCount).toBe(2);
      
      // Verify they were actually deleted from the DB
      const fromDb = await collection.find({ createdBy: commonUserId }).toArray();
      expect(fromDb.length).toBe(0);
    });

    it('should return 0 when no archives match filter', async () => {
      // Act
      const deleteCount = await repository.deleteMany({ name: 'Non-Existent Archive' });

      // Assert
      expect(deleteCount).toBe(0);
    });
  });

  describe('count', () => {
    it('should count archives matching filter', async () => {
      // Act
      const count = await repository.count({ createdBy: mockUserId1 });

      // Assert
      expect(count).toBe(1);
    });

    it('should count all archives when no filter provided', async () => {
      // Act
      const count = await repository.count();

      // Assert
      expect(count).toBe(2);
    });
  });

  describe('exists', () => {
    it('should return true for existing archive', async () => {
      // Act
      const exists = await repository.exists(insertedIds[0].toString());

      // Assert
      expect(exists).toBe(true);
    });

    it('should return false for non-existing archive', async () => {
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

  describe('Archive-specific methods', () => {
    it('should find archives by creator', async () => {
      // Act
      const result = await repository.findByCreator(mockUserId1.toString());

      // Assert
      expect(result.items.length).toBe(1);
      expect(result.items[0].createdBy).toEqual(mockUserId1);
    });

    it('should return empty result for invalid creator ID', async () => {
      // Act
      const result = await repository.findByCreator('invalid-id');

      // Assert
      expect(result.items.length).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should add a recipe to an archive', async () => {
      // Arrange
      const newRecipe = {
        ...mockRecipe1,
        name: 'Added Recipe',
        originalId: new ObjectId(),
        archivedDate: new Date()
      };

      // Act
      const result = await repository.addRecipe(
        insertedIds[0].toString(),
        newRecipe
      );

      // Assert
      expect(result.recipes.length).toBe(2);
      expect(result.recipes[1].name).toBe('Added Recipe');
      expect(result.recipes[1].originalId).toEqual(newRecipe.originalId);
      
      // Verify lastModifiedDate was updated
      expect(result.lastModifiedDate.getTime()).toBeGreaterThan(
        mockArchives[0].lastModifiedDate.getTime()
      );
      
      // Verify it was updated in the DB
      const fromDb = await collection.findOne({ _id: insertedIds[0] });
      expect(fromDb?.recipes.length).toBe(2);
    });

    it('should add a recipe with string originalId', async () => {
      // Arrange
      const recipeId = new ObjectId();
      const newRecipe = {
        ...mockRecipe1,
        name: 'String ID Recipe',
        originalId: recipeId.toString(), // String ID
        archivedDate: new Date()
      };

      // Act
      const result = await repository.addRecipe(
        insertedIds[0].toString(),
        newRecipe as any // Cast needed because we're passing string instead of ObjectId
      );

      // Assert
      expect(result.recipes.length).toBe(2);
      expect(result.recipes[1].name).toBe('String ID Recipe');
      expect(result.recipes[1].originalId).toEqual(recipeId); // Should be converted to ObjectId
    });

    it('should throw error when adding recipe to invalid archive id', async () => {
      // Act & Assert
      await expect(repository.addRecipe(
        'invalid-id',
        {
          ...mockRecipe1,
          name: 'Will Fail Recipe',
          originalId: new ObjectId(),
          archivedDate: new Date()
        }
      )).rejects.toThrow('Invalid archive ID');
    });

    it('should remove a recipe from an archive', async () => {
      // Add a second recipe to the first archive
      const secondRecipe = {
        ...mockRecipe2,
        originalId: new ObjectId()
      };
      
      await collection.updateOne(
        { _id: insertedIds[0] },
        { $push: { recipes: secondRecipe } }
      );
      
      // Verify we have 2 recipes
      const archiveBeforeRemove = await collection.findOne({ _id: insertedIds[0] });
      expect(archiveBeforeRemove?.recipes.length).toBe(2);
      
      // Act - Remove the first recipe
      const result = await repository.removeRecipe(
        insertedIds[0].toString(),
        mockRecipe1.originalId.toString()
      );

      // Assert
      expect(result.recipes.length).toBe(1);
      expect(result.recipes[0].originalId).toEqual(secondRecipe.originalId);
      
      // Verify it was updated in the DB
      const fromDb = await collection.findOne({ _id: insertedIds[0] });
      expect(fromDb?.recipes.length).toBe(1);
    });

    it('should throw error when removing recipe with invalid ids', async () => {
      // Act & Assert - Invalid archive ID
      await expect(repository.removeRecipe(
        'invalid-id',
        mockRecipe1.originalId.toString()
      )).rejects.toThrow('Invalid ID provided');
      
      // Act & Assert - Invalid recipe ID
      await expect(repository.removeRecipe(
        insertedIds[0].toString(),
        'invalid-id'
      )).rejects.toThrow('Invalid ID provided');
    });
  });
});