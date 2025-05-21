import { connectToDatabase } from "@/lib/mongodb";
import { BaseRepository } from "./base/BaseRepository";
import { Archive } from "@/types/Archive";
import { MongoArchiveRepository } from "./implementations/MongoArchiveRepository";
import { ensureServicesInitialized, getRepository, RepositoryTokens } from "@/lib/services";

/**
 * Singleton instance of the archive repository
 */
let archiveRepository: BaseRepository<Archive> & MongoArchiveRepository | null = null;

/**
 * Factory function to get or create the archive repository instance
 * Uses a singleton pattern to avoid creating multiple connections
 * 
 * @returns A promise resolving to the archive repository instance
 */
export async function getArchiveRepository(): Promise<BaseRepository<Archive> & MongoArchiveRepository> {
  // Legacy method to maintain compatibility
  try {
    // Try to get repository from the container first
    await ensureServicesInitialized();
    return getRepository(RepositoryTokens.ArchiveRepository) as BaseRepository<Archive> & MongoArchiveRepository;
  } catch (error) {
    // Fall back to the old method
    if (!archiveRepository) {
      const { archives } = await connectToDatabase();
      archiveRepository = new MongoArchiveRepository(archives);
    }
    return archiveRepository;
  }
}