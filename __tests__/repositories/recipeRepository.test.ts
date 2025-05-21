import { MongoClient, Collection, ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Recipe } from '@/types/Recipe';
import { MongoRecipeRepository } from '@/repositories/implementations/MongoRecipeRepository';
import { ListResult } from '@/repositories/base/types';

// Mock recipe data for testing
const mockRecipes: Omit<Recipe, '_id'>[] = [
  {
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
    description: 'A test recipe'
  },
  {
    name: 'Test Recipe 2',
    createdDate: new Date('2023-01-02').toISOString(),
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
    description: 'Another test recipe'
  }
];

describe('MongoRecipeRepository', () => {
  let mongoServer: MongoMemoryServer;
  let mongoClient: MongoClient;
  let collection: Collection<Recipe>;
  let repository: MongoRecipeRepository;
  let insertedIds: string[] = [];

  beforeAll(async () => {
    // Start an in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();

    // Set up collection and repository
    const db = mongoClient.db('test-db');
    collection = db.collection<Recipe>('recipes');
    repository = new MongoRecipeRepository(collection);
  });

  beforeEach(async () => {
    // Clear the collection before each test
    await collection.deleteMany({});
    insertedIds = [];

    // Insert test data
    const data = mockRecipes.map(recipe => ({
      ...recipe,
      _id: new ObjectId().toString()
    }));
    
    const insertResult = await collection.insertMany(data);
    
    // Store inserted IDs for later use
    insertedIds = data.map(r => r._id);
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  describe('findAll', () => {
    it('should return all recipes with pagination', async () => {
      // Act
      const result = await repository.findAll();

      // Assert
      expect(result.items.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.items[0].name).toEqual(expect.stringMatching(/Test Recipe/));
    });

    it('should respect pagination options', async () => {
      // Insert more recipes to test pagination
      const moreMockRecipes = Array(8).fill(null).map((_, i) => ({
        ...mockRecipes[0],
        name: `Pagination Test Recipe ${i + 1}`
      }));
      
      await collection.insertMany(
        moreMockRecipes.map(recipe => ({
          ...recipe,
          _id: new ObjectId().toString()
        }))
      );

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
    it('should find a recipe by id', async () => {
      // Act
      const result = await repository.findById(insertedIds[0]);

      // Assert
      expect(result).not.toBeNull();
      expect(result?._id).toBe(insertedIds[0]);
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
    it('should find recipes matching a filter', async () => {
      // Act
      const result = await repository.findByFilter({ station: 'Bakery' });

      // Assert
      expect(result.items.length).toBe(1);
      expect(result.items[0].station).toBe('Bakery');
    });

    it('should return empty result for non-matching filter', async () => {
      // Act
      const result = await repository.findByFilter({ station: 'NonExistent' });

      // Assert
      expect(result.items.length).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    it('should create a new recipe', async () => {
      // Arrange
      const newRecipe: Omit<Recipe, '_id'> = {
        name: 'New Test Recipe',
        createdDate: new Date().toISOString(),
        version: '1.0',
        station: 'Test Station',
        batchNumber: 3,
        equipment: ['Test Equipment'],
        ingredients: [{ id: 5, productName: 'Test Ingredient', quantity: 1, unit: 'piece' }],
        yield: '1 serving',
        portionSize: 'Test',
        portionsPerRecipe: '1',
        procedure: ['Test procedure']
      };

      // Act
      const result = await repository.create(newRecipe);

      // Assert
      expect(result._id).toBeDefined();
      expect(result.name).toBe(newRecipe.name);
      
      // Verify it was actually inserted in the DB
      const fromDb = await collection.findOne({ _id: result._id });
      expect(fromDb).not.toBeNull();
      expect(fromDb?.name).toBe(newRecipe.name);
    });
  });

  describe('createMany', () => {
    it('should create multiple recipes', async () => {
      // Arrange
      const newRecipes: Omit<Recipe, '_id'>[] = [
        {
          name: 'Batch Recipe 1',
          createdDate: new Date().toISOString(),
          version: '1.0',
          station: 'Batch Station',
          batchNumber: 10,
          equipment: ['Batch Equipment'],
          ingredients: [{ id: 6, productName: 'Batch Ingredient', quantity: 1, unit: 'unit' }],
          yield: '1 batch',
          portionSize: 'Batch',
          portionsPerRecipe: '10',
          procedure: ['Batch procedure']
        },
        {
          name: 'Batch Recipe 2',
          createdDate: new Date().toISOString(),
          version: '1.0',
          station: 'Batch Station',
          batchNumber: 11,
          equipment: ['Batch Equipment'],
          ingredients: [{ id: 7, productName: 'Batch Ingredient', quantity: 2, unit: 'units' }],
          yield: '2 batches',
          portionSize: 'Batch',
          portionsPerRecipe: '20',
          procedure: ['Another batch procedure']
        }
      ];

      // Act
      const results = await repository.createMany(newRecipes);

      // Assert
      expect(results.length).toBe(2);
      expect(results[0]._id).toBeDefined();
      expect(results[1]._id).toBeDefined();
      expect(results[0].name).toBe('Batch Recipe 1');
      expect(results[1].name).toBe('Batch Recipe 2');
      
      // Verify they were actually inserted in the DB
      const fromDb = await collection.find({ station: 'Batch Station' }).toArray();
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
    it('should update an existing recipe', async () => {
      // Arrange
      const updateData: Partial<Recipe> = {
        name: 'Updated Recipe Name',
        description: 'Updated description'
      };

      // Act
      const result = await repository.update(insertedIds[0], updateData);

      // Assert
      expect(result._id).toBe(insertedIds[0]);
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      
      // Verify it was actually updated in the DB
      const fromDb = await collection.findOne({ _id: insertedIds[0] });
      expect(fromDb?.name).toBe(updateData.name);
    });

    it('should throw error for invalid id', async () => {
      // Act & Assert
      await expect(repository.update('invalid-id', { name: 'Test' }))
        .rejects.toThrow('Invalid recipe ID');
    });

    it('should throw error for non-existent id', async () => {
      // Act & Assert
      await expect(repository.update(new ObjectId().toString(), { name: 'Test' }))
        .rejects.toThrow('Recipe not found');
    });
  });

  describe('upsert', () => {
    it('should update existing document when found', async () => {
      // Arrange
      const filter = { _id: insertedIds[0] };
      const updateData: Partial<Recipe> = { name: 'Upserted Recipe' };

      // Act
      const result = await repository.upsert(filter, updateData);

      // Assert
      expect(result._id).toBe(insertedIds[0]);
      expect(result.name).toBe(updateData.name);
    });

    it('should insert new document when not found', async () => {
      // Arrange
      const filter = { name: 'Non-existent Recipe' };
      const upsertData: Partial<Recipe> = {
        name: 'Non-existent Recipe',
        version: '1.0',
        station: 'Upsert Station',
        batchNumber: 100,
        equipment: ['Upsert Equipment'],
        ingredients: [{ id: 8, productName: 'Upsert Ingredient', quantity: 1, unit: 'unit' }],
        yield: 'Upsert yield',
        portionSize: 'Upsert',
        portionsPerRecipe: '1',
        procedure: ['Upsert procedure'],
        createdDate: new Date().toISOString()
      };

      // Act
      const result = await repository.upsert(filter, upsertData);

      // Assert
      expect(result._id).toBeDefined();
      expect(result.name).toBe(upsertData.name);
      
      // Verify it was actually inserted in the DB
      const fromDb = await collection.findOne({ name: 'Non-existent Recipe' });
      expect(fromDb).not.toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing recipe', async () => {
      // Act
      await repository.delete(insertedIds[0]);

      // Assert - verify it was actually deleted from the DB
      const fromDb = await collection.findOne({ _id: insertedIds[0] });
      expect(fromDb).toBeNull();
    });

    it('should throw error for invalid id', async () => {
      // Act & Assert
      await expect(repository.delete('invalid-id'))
        .rejects.toThrow('Invalid recipe ID');
    });

    it('should throw error for non-existent id', async () => {
      // Act & Assert
      await expect(repository.delete(new ObjectId().toString()))
        .rejects.toThrow('Recipe not found');
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple recipes matching filter', async () => {
      // Arrange - Add some recipes with the same station
      await collection.insertMany([
        {
          ...mockRecipes[0],
          _id: new ObjectId().toString(),
          station: 'DeleteStation'
        },
        {
          ...mockRecipes[1],
          _id: new ObjectId().toString(),
          station: 'DeleteStation'
        }
      ]);

      // Act
      const deleteCount = await repository.deleteMany({ station: 'DeleteStation' });

      // Assert
      expect(deleteCount).toBe(2);
      
      // Verify they were actually deleted from the DB
      const fromDb = await collection.find({ station: 'DeleteStation' }).toArray();
      expect(fromDb.length).toBe(0);
    });

    it('should return 0 when no recipes match filter', async () => {
      // Act
      const deleteCount = await repository.deleteMany({ station: 'NonExistentStation' });

      // Assert
      expect(deleteCount).toBe(0);
    });
  });

  describe('count', () => {
    it('should count recipes matching filter', async () => {
      // Act
      const count = await repository.count({ station: 'Kitchen' });

      // Assert
      expect(count).toBe(1);
    });

    it('should count all recipes when no filter provided', async () => {
      // Act
      const count = await repository.count();

      // Assert
      expect(count).toBe(2);
    });
  });

  describe('exists', () => {
    it('should return true for existing recipe', async () => {
      // Act
      const exists = await repository.exists(insertedIds[0]);

      // Assert
      expect(exists).toBe(true);
    });

    it('should return false for non-existing recipe', async () => {
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

  describe('Recipe-specific methods', () => {
    it('should find recipes by ingredient', async () => {
      // Act
      const result = await repository.findByIngredient('Flour');

      // Assert
      expect(result.items.length).toBe(1);
      expect(result.items[0].ingredients.some(ing => ing.productName === 'Flour')).toBe(true);
    });

    it('should find recipes by station', async () => {
      // Act
      const result = await repository.findByStation('Bakery');

      // Assert
      expect(result.items.length).toBe(1);
      expect(result.items[0].station).toBe('Bakery');
    });
  });
});