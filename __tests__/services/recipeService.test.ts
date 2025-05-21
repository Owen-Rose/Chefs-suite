import { RecipeService } from '../../services/recipeService';
import { NotFoundError } from '../../errors/NotFoundError';
import { ValidationError } from '../../errors/ValidationError';
import { mockRecipeRepository, createMockRecipe } from '../utils/mockFactory';
import { ObjectId } from 'mongodb';
import { Container } from '@/lib/container';
import { RepositoryTokens, ServiceTokens } from '@/lib/services';
import { Recipe } from '@/types/Recipe';

// Mock the repository factory function
jest.mock('../../repositories/recipeRepository', () => ({
  getRecipeRepository: jest.fn(),
  getMongoRecipeRepository: jest.fn(),
}));

// Mock the services module to prevent initialization in tests
jest.mock('../../lib/services', () => {
  const actual = jest.requireActual('../../lib/services');
  return {
    ...actual,
    ensureServicesInitialized: jest.fn().mockResolvedValue(undefined),
  };
});

// Mock the logger to prevent console output during tests
jest.mock('../../utils/logger', () => ({
  Logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('RecipeService', () => {
  const mockRecipes = [
    createMockRecipe({
      _id: new ObjectId().toString(),
      name: 'Chocolate Cake',
      ingredients: [
        { id: 1, productName: 'Flour', name: 'Flour', quantity: 200, unit: 'g' },
        { id: 2, productName: 'Sugar', name: 'Sugar', quantity: 150, unit: 'g' },
        { id: 3, productName: 'Chocolate', name: 'Chocolate', quantity: 100, unit: 'g' },
      ],
      procedure: ['Mix dry ingredients', 'Add wet ingredients', 'Bake for 30 minutes'],
      prepTime: 20,
      cookTime: 30,
      servings: 8,
      createdBy: new ObjectId(),
    }),
    createMockRecipe({
      _id: new ObjectId().toString(),
      name: 'Banana Bread',
      ingredients: [
        { id: 1, productName: 'Flour', name: 'Flour', quantity: 250, unit: 'g' },
        { id: 2, productName: 'Sugar', name: 'Sugar', quantity: 100, unit: 'g' },
        { id: 3, productName: 'Bananas', name: 'Bananas', quantity: 3, unit: 'whole' },
      ],
      procedure: ['Mash bananas', 'Mix with dry ingredients', 'Bake for 45 minutes'],
      prepTime: 15,
      cookTime: 45,
      servings: 6,
      createdBy: new ObjectId(),
    }),
  ];

  let repository: any;
  let service: RecipeService;

  describe('Traditional approach (direct instantiation)', () => {
    beforeEach(() => {
      repository = mockRecipeRepository(mockRecipes);
      service = new RecipeService(repository);
    });
  
    it('should return all recipes with pagination', async () => {
      const result = await service.getAllRecipes();
      
      expect(repository.findAll).toHaveBeenCalled();
      expect(result.items).toEqual(mockRecipes);
    });
  });

  describe('Container-based approach', () => {
    let container: Container;

    beforeEach(() => {
      // Create a test container with mock repositories
      container = new Container();
      
      // Register mock repositories
      repository = mockRecipeRepository(mockRecipes);
      container.registerInstance(RepositoryTokens.RecipeRepository, repository);
      
      // Register services
      container.register(
        ServiceTokens.RecipeService,
        () => new RecipeService(repository)
      );
      
      // Get the service from the container
      service = container.resolve(ServiceTokens.RecipeService);
    });

    describe('getAllRecipes', () => {
      it('should return all recipes with pagination', async () => {
        const result = await service.getAllRecipes();
        
        expect(repository.findAll).toHaveBeenCalled();
        expect(result.items).toEqual(mockRecipes);
      });
  
      it('should handle error when fetching recipes fails', async () => {
        repository.findAll.mockRejectedValue(new Error('Database error'));
        
        await expect(service.getAllRecipes()).rejects.toThrow('Database error');
      });
    });
  
    describe('getRecipeById', () => {
      it('should return a recipe when it exists', async () => {
        const id = mockRecipes[0]._id!.toString();
        const result = await service.getRecipeById(id);
        
        expect(repository.findById).toHaveBeenCalledWith(id, undefined);
        expect(result).toEqual(mockRecipes[0]);
      });
  
      it('should throw NotFoundError when recipe does not exist', async () => {
        repository.findById.mockResolvedValue(null);
        
        await expect(service.getRecipeById('non-existent-id')).rejects.toThrow(NotFoundError);
        expect(repository.findById).toHaveBeenCalledWith('non-existent-id', undefined);
      });
    });
  
    describe('createRecipe', () => {
      const validRecipe = createMockRecipe({
        name: 'New Recipe',
        ingredients: [{ id: 1, productName: 'Ingredient', quantity: 100, unit: 'g' }],
        procedure: ['Step 1'],
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        createdBy: new ObjectId(),
      });
  
      it('should create a recipe with valid data', async () => {
        const { _id, ...recipeData } = validRecipe;
        const result = await service.createRecipe(recipeData);
        
        expect(repository.create).toHaveBeenCalledWith(recipeData, undefined);
        expect(result).toBeDefined();
      });
  
      it('should throw ValidationError when recipe name is empty', async () => {
        const { _id, ...recipeData } = validRecipe;
        const invalidRecipe = { ...recipeData, name: '' };
        
        await expect(service.createRecipe(invalidRecipe)).rejects.toThrow(ValidationError);
        expect(repository.create).not.toHaveBeenCalled();
      });
  
      it('should throw ValidationError when ingredients are empty', async () => {
        const { _id, ...recipeData } = validRecipe;
        const invalidRecipe = { ...recipeData, ingredients: [] };
        
        await expect(service.createRecipe(invalidRecipe)).rejects.toThrow(ValidationError);
        expect(repository.create).not.toHaveBeenCalled();
      });
  
      it('should throw ValidationError when procedure is empty', async () => {
        const { _id, ...recipeData } = validRecipe;
        const invalidRecipe = { ...recipeData, procedure: [] };
        
        await expect(service.createRecipe(invalidRecipe)).rejects.toThrow(ValidationError);
        expect(repository.create).not.toHaveBeenCalled();
      });
    });
  
    describe('updateRecipe', () => {
      const recipeId = mockRecipes[0]._id!.toString();
      const validUpdate = { name: 'Updated Recipe Name' };
  
      it('should update a recipe with valid data', async () => {
        const result = await service.updateRecipe(recipeId, validUpdate);
        
        expect(repository.update).toHaveBeenCalledWith(recipeId, validUpdate, undefined);
        expect(result).toBeDefined();
      });
  
      it('should throw ValidationError when recipe name is invalid', async () => {
        const invalidUpdate = { name: '' };
        
        await expect(service.updateRecipe(recipeId, invalidUpdate)).rejects.toThrow(ValidationError);
        expect(repository.update).not.toHaveBeenCalled();
      });
  
      it('should throw NotFoundError when recipe does not exist', async () => {
        repository.update.mockImplementation(() => {
          throw new Error('Recipe not found');
        });
        
        await expect(service.updateRecipe('non-existent-id', validUpdate)).rejects.toThrow(NotFoundError);
      });
    });
  
    describe('deleteRecipe', () => {
      const recipeId = mockRecipes[0]._id!.toString();
  
      it('should delete a recipe when it exists', async () => {
        await service.deleteRecipe(recipeId);
        
        expect(repository.delete).toHaveBeenCalledWith(recipeId, undefined);
      });
  
      it('should throw NotFoundError when recipe does not exist', async () => {
        repository.delete.mockImplementation(() => {
          throw new Error('Recipe not found');
        });
        
        await expect(service.deleteRecipe('non-existent-id')).rejects.toThrow(NotFoundError);
      });
    });
  
    describe('searchRecipes', () => {
      it('should search recipes with filter criteria', async () => {
        const filter = { name: 'Chocolate' };
        const options = { limit: 5 };
        
        await service.searchRecipes(filter, options);
        
        expect(repository.findByFilter).toHaveBeenCalledWith(filter, options, undefined);
      });
    });
  
    describe('createManyRecipes', () => {
      const validRecipes = [
        createMockRecipe({
          name: 'Recipe 1',
          ingredients: [{ id: 1, productName: 'Ingredient', quantity: 100, unit: 'g' }],
          procedure: ['Step 1'],
          prepTime: 10,
          cookTime: 20,
          servings: 4,
          createdBy: new ObjectId(),
        }),
        createMockRecipe({
          name: 'Recipe 2',
          ingredients: [{ id: 2, productName: 'Ingredient', quantity: 100, unit: 'g' }],
          procedure: ['Step 1'],
          prepTime: 10,
          cookTime: 20,
          servings: 4,
          createdBy: new ObjectId(),
        }),
      ];
  
      it('should create multiple recipes with valid data', async () => {
        const recipeData = validRecipes.map(({ _id, ...rest }) => rest);
        await service.createManyRecipes(recipeData);
        
        expect(repository.createMany).toHaveBeenCalledWith(recipeData, undefined);
      });
  
      it('should throw ValidationError when any recipe is invalid', async () => {
        const recipeData = [
          ...validRecipes.map(({ _id, ...rest }) => rest),
          createMockRecipe({
            name: '',  // Invalid name
            ingredients: [{ id: 3, productName: 'Ingredient', quantity: 100, unit: 'g' }],
            procedure: ['Step 1'],
            prepTime: 10,
            cookTime: 20,
            servings: 4,
            createdBy: new ObjectId(),
          }),
        ];
        
        await expect(service.createManyRecipes(recipeData)).rejects.toThrow(ValidationError);
        expect(repository.createMany).not.toHaveBeenCalled();
      });
    });
  });
});