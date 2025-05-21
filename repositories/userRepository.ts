import { connectToDatabase } from "@/lib/mongodb";
import { BaseRepository } from "./base/BaseRepository";
import { User } from "@/types/User";
import { MongoUserRepository } from "./implementations/MongoUserRepository";
import { ensureServicesInitialized, getRepository, RepositoryTokens } from "@/lib/services";

/**
 * Singleton instance of the user repository
 */
let userRepository: BaseRepository<User> | null = null;

/**
 * Factory function to get or create the user repository instance
 * Uses a singleton pattern to avoid creating multiple connections
 * 
 * @returns A promise resolving to the user repository instance
 */
export async function getUserRepository(): Promise<BaseRepository<User>> {
  // Legacy method to maintain compatibility
  try {
    // Try to get repository from the container first
    await ensureServicesInitialized();
    return getRepository(RepositoryTokens.UserRepository);
  } catch (error) {
    // Fall back to the old method
    if (!userRepository) {
      const { users } = await connectToDatabase();
      userRepository = new MongoUserRepository(users);
    }
    return userRepository;
  }
}

/**
 * Get the MongoDB implementation of the user repository
 * This is useful when you need access to user-specific methods not in the base interface
 * 
 * @returns A promise resolving to the MongoDB user repository instance
 */
export async function getMongoUserRepository(): Promise<MongoUserRepository> {
  const repo = await getUserRepository();
  return repo as MongoUserRepository;
}