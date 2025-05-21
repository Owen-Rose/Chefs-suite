import { mock, MockProxy } from 'jest-mock-extended';
import { ObjectId } from 'mongodb';
import { User } from '../../types/User';
import { UserRole } from '../../types/Roles';
import { MongoUserRepository } from '../../repositories/implementations/MongoUserRepository';
import { Recipe } from '@/types/Recipe';
import { BaseRepository } from '@/repositories/base/BaseRepository';
import { ListResult, QueryOptions } from '@/repositories/base/types';
import { Ingredient } from '@/types/Ingredient';

/**
 * Interface for recipe repository mock with specific recipe methods
 */
export interface MockRecipeRepository extends BaseRepository<Recipe> {
  findByIngredient(ingredient: string, options?: QueryOptions): Promise<ListResult<Recipe>>;
  findByStation(station: string, options?: QueryOptions): Promise<ListResult<Recipe>>;
}

/**
 * Creates a mock Recipe object for testing
 */
export function createMockRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    _id: new ObjectId().toString(),
    name: 'Test Recipe',
    createdDate: new Date().toISOString(),
    version: '1.0',
    station: 'Test Station',
    batchNumber: 1,
    equipment: ['Bowl', 'Whisk'],
    ingredients: [
      { 
        id: 1, 
        productName: 'Test Ingredient', 
        name: 'Test Ingredient', 
        quantity: 100, 
        unit: 'g' 
      }
    ],
    yield: '100g',
    portionSize: '10g',
    portionsPerRecipe: '10',
    procedure: ['Step 1', 'Step 2'],
    description: 'Test description',
    ...overrides
  };
}

/**
 * Creates a mock RecipeRepository with predefined behavior for common methods
 */
export function mockRecipeRepository(recipes: Recipe[] = []): MockProxy<MockRecipeRepository> & MockRecipeRepository {
  const mockRepo = mock<MockRecipeRepository>();
  
  // Convert any array items to proper Recipe objects
  const mockRecipes = recipes.map(r => {
    if (!r._id) r._id = new ObjectId().toString();
    if (!r.createdDate) r.createdDate = new Date().toISOString();
    return r;
  });
  
  // Setup default behaviors
  mockRepo.findById.mockImplementation(async (id) => {
    const recipe = mockRecipes.find(r => r._id?.toString() === id.toString());
    return recipe || null;
  });
  
  mockRepo.findAll.mockImplementation(async (options) => {
    const skip = options?.skip || 0;
    const limit = options?.limit || 10;
    const items = mockRecipes.slice(skip, skip + limit);
    
    return {
      items,
      total: mockRecipes.length,
      page: Math.floor(skip / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(mockRecipes.length / limit)
    };
  });
  
  mockRepo.findByFilter.mockImplementation(async (filter, options) => {
    // This is a simplified implementation for testing
    return mockRepo.findAll(options);
  });
  
  mockRepo.create.mockImplementation(async (data) => {
    const newRecipe: Recipe = {
      _id: new ObjectId().toString(),
      ...data as any,
      createdDate: data.createdDate || new Date().toISOString(),
      version: data.version || '1.0'
    };
    return newRecipe;
  });
  
  mockRepo.createMany.mockImplementation(async (dataArray) => {
    return dataArray.map(data => ({
      _id: new ObjectId().toString(),
      ...data as any,
      createdDate: data.createdDate || new Date().toISOString(),
      version: data.version || '1.0'
    }));
  });
  
  mockRepo.update.mockImplementation(async (id, data) => {
    const recipe = mockRecipes.find(r => r._id?.toString() === id.toString());
    if (!recipe) throw new Error("Recipe not found");
    
    const updated = {
      ...recipe,
      ...data
    };
    return updated;
  });
  
  mockRepo.upsert.mockImplementation(async (filter, data) => {
    return {
      _id: new ObjectId().toString(),
      ...data as any,
      createdDate: new Date().toISOString(),
      version: '1.0'
    };
  });
  
  mockRepo.delete.mockImplementation(async (id) => {
    const recipe = mockRecipes.find(r => r._id?.toString() === id.toString());
    if (!recipe) throw new Error("Recipe not found");
    return;
  });
  
  mockRepo.deleteMany.mockImplementation(async () => {
    return 1;
  });
  
  mockRepo.count.mockImplementation(async () => {
    return mockRecipes.length;
  });
  
  mockRepo.exists.mockImplementation(async (id) => {
    return mockRecipes.some(r => r._id?.toString() === id.toString());
  });
  
  mockRepo.findByIngredient.mockImplementation(async (ingredient, options) => {
    const filteredRecipes = mockRecipes.filter(r => 
      r.ingredients?.some((i: any) => i.name?.toLowerCase().includes(ingredient.toLowerCase()))
    );
    
    const skip = options?.skip || 0;
    const limit = options?.limit || 10;
    const items = filteredRecipes.slice(skip, skip + limit);
    
    return {
      items,
      total: filteredRecipes.length,
      page: Math.floor(skip / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(filteredRecipes.length / limit)
    };
  });
  
  mockRepo.findByStation.mockImplementation(async (station, options) => {
    const filteredRecipes = mockRecipes.filter(r => 
      r.station?.toLowerCase().includes(station.toLowerCase())
    );
    
    const skip = options?.skip || 0;
    const limit = options?.limit || 10;
    const items = filteredRecipes.slice(skip, skip + limit);
    
    return {
      items,
      total: filteredRecipes.length,
      page: Math.floor(skip / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(filteredRecipes.length / limit)
    };
  });
  
  return mockRepo;
}

/**
 * Creates a mock UserRepository with predefined behavior for common methods
 */
export function mockUserRepository(users: User[] = []): MockProxy<MongoUserRepository> & MongoUserRepository {
  const mockRepo = mock<MongoUserRepository>();
  
  // Setup default behaviors
  mockRepo.findById.mockImplementation(async (id) => {
    const user = users.find(u => u._id?.toString() === id.toString());
    return user || null;
  });
  
  mockRepo.findByEmail.mockImplementation(async (email) => {
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    return user || null;
  });
  
  mockRepo.emailExists.mockImplementation(async (email) => {
    return users.some(u => u.email?.toLowerCase() === email.toLowerCase());
  });
  
  mockRepo.findAll.mockImplementation(async (options) => {
    const skip = options?.skip || 0;
    const limit = options?.limit || 10;
    const items = users.slice(skip, skip + limit);
    
    return {
      items,
      total: users.length,
      page: Math.floor(skip / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(users.length / limit)
    };
  });
  
  mockRepo.findByFilter.mockImplementation(async (filter, options) => {
    // This is a simplified implementation for testing
    return mockRepo.findAll(options);
  });
  
  mockRepo.create.mockImplementation(async (data) => {
    const newUser = {
      _id: new ObjectId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    } as unknown as User;
    return newUser;
  });
  
  mockRepo.createMany.mockImplementation(async (dataArray) => {
    return dataArray.map(data => ({
      _id: new ObjectId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    })) as unknown as User[];
  });
  
  mockRepo.update.mockImplementation(async (id, data) => {
    const user = users.find(u => u._id?.toString() === id.toString());
    if (!user) throw new Error("User not found");
    
    const updated = {
      ...user,
      ...data,
      updatedAt: new Date()
    } as unknown as User;
    return updated;
  });
  
  mockRepo.upsert.mockImplementation(async (filter, data) => {
    return {
      _id: new ObjectId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    } as unknown as User;
  });
  
  mockRepo.updatePassword.mockImplementation(async (id, password) => {
    const user = users.find(u => u._id?.toString() === id.toString());
    if (!user) throw new Error("User not found");
    
    const updated = {
      ...user,
      password,
      updatedAt: new Date()
    } as unknown as User;
    return updated;
  });
  
  mockRepo.delete.mockImplementation(async (id) => {
    const user = users.find(u => u._id?.toString() === id.toString());
    if (!user) throw new Error("User not found");
    return;
  });
  
  mockRepo.deleteMany.mockImplementation(async () => {
    return users.length;
  });
  
  mockRepo.count.mockImplementation(async () => {
    return users.length;
  });
  
  mockRepo.exists.mockImplementation(async (id) => {
    return users.some(u => u._id?.toString() === id.toString());
  });
  
  return mockRepo;
}

/**
 * Create a test user for testing
 */
export function createTestUser(overrides: Partial<User> = {}): User {
  return {
    _id: new ObjectId(),
    FirstName: 'Test',
    LastName: 'User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: UserRole.STAFF,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  } as unknown as User;
}

/**
 * Create a mock MongoDB ClientSession for testing transactions
 */
export function mockClientSession(): any {
  return {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };
}

/**
 * Create mock MongoDB objects
 */
export function mockMongoDb() {
  const session = mockClientSession();
  const db = {
    collection: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue(0),
      }),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(0),
    }),
    command: jest.fn(),
  };
  
  const client = {
    db: jest.fn().mockReturnValue(db),
    startSession: jest.fn().mockReturnValue(session),
  };
  
  return { client, db, session };
}