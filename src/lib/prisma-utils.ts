/**
 * Prisma utility functions for cross-database compatibility
 */

/**
 * Detects the database provider from DATABASE_URL
 * @returns 'postgresql' | 'sqlite' | 'unknown'
 */
let cachedProvider: 'postgresql' | 'sqlite' | 'unknown' | null = null;

export function getDatabaseProvider(): 'postgresql' | 'sqlite' | 'unknown' {
  if (cachedProvider !== null) {
    return cachedProvider;
  }

  const databaseUrl = process.env.DATABASE_URL || '';
  
  if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
    cachedProvider = 'postgresql';
  } else if (databaseUrl.startsWith('file:') || databaseUrl.includes('sqlite')) {
    cachedProvider = 'sqlite';
  } else {
    cachedProvider = 'unknown';
  }
  
  return cachedProvider;
}

/**
 * Creates a case-insensitive string filter that works across SQLite and PostgreSQL
 * 
 * PostgreSQL: Uses native `mode: 'insensitive'` support
 * SQLite: Search is case-sensitive by default (limitation of SQLite)
 * 
 * @param value - The search string
 * @returns Prisma StringFilter with appropriate case sensitivity
 */
export function caseInsensitiveStringFilter(value: string): { contains: string; mode?: 'insensitive' } {
  const provider = getDatabaseProvider();
  
  if (provider === 'postgresql') {
    // PostgreSQL supports case-insensitive mode
    return { contains: value, mode: 'insensitive' };
  }
  
  // SQLite: Return case-sensitive search
  // Note: For true case-insensitive search in SQLite, data should be normalized
  // or use raw SQL with LOWER() functions
  return { contains: value };
}
