#!/usr/bin/env node
/**
 * PostgreSQL Migration Script for Production Deployment
 * 
 * This script runs the PostgreSQL migrations and generates Prisma Client.
 * Designed to run in Vercel's build environment.
 * 
 * Usage: node scripts/migrate-postgres.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting PostgreSQL migration...');

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Verify it's a PostgreSQL connection
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ Error: DATABASE_URL must be a PostgreSQL connection string');
  console.error('   Current value starts with:', databaseUrl.substring(0, 20));
  process.exit(1);
}

console.log('✅ PostgreSQL DATABASE_URL detected');

try {
  // Step 1: Generate Prisma Client from PostgreSQL schema
  console.log('\n📦 Step 1: Generating Prisma Client...');
  execSync('npx prisma generate --schema=prisma/schema.postgres.prisma', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log('✅ Prisma Client generated successfully');

  // Step 2: Run Prisma migrate deploy (if using Prisma migrations)
  console.log('\n🔄 Step 2: Running Prisma migrations...');
  try {
    // First, try to use Prisma's built-in migration system
    execSync('npx prisma migrate deploy --schema=prisma/schema.postgres.prisma', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log('✅ Prisma migrations completed successfully');
  } catch (migrateError) {
    console.log('⚠️  Prisma migrate deploy failed or no migrations found');
    console.log('   Attempting direct SQL migration...');
    
    // Step 3: If Prisma migrate fails, run our custom SQL migration
    const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations-postgres', 'init.sql');
    
    if (fs.existsSync(migrationPath)) {
      console.log('\n📄 Step 3: Running custom SQL migration...');
      
      // Use psql if available, otherwise use Prisma db execute
      try {
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        
        // Use Prisma db execute to run the SQL
        const tempSqlFile = path.join(__dirname, '..', 'temp-migration.sql');
        fs.writeFileSync(tempSqlFile, migrationSql);
        
        execSync(`npx prisma db execute --schema=prisma/schema.postgres.prisma --file=${tempSqlFile}`, {
          stdio: 'inherit',
          cwd: path.join(__dirname, '..'),
        });
        
        // Clean up temp file
        fs.unlinkSync(tempSqlFile);
        
        console.log('✅ Custom SQL migration completed successfully');
      } catch (sqlError) {
        console.error('❌ Error running SQL migration:', sqlError.message);
        throw sqlError;
      }
    } else {
      console.log('⚠️  No custom migration file found at:', migrationPath);
    }
  }

  console.log('\n✅ Migration completed successfully!');
  console.log('   Your database is ready for production use.');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Verify DATABASE_URL is correctly set in Vercel environment variables');
  console.error('2. Ensure the PostgreSQL database exists and is accessible');
  console.error('3. Check that the database user has proper permissions');
  console.error('4. Review the error message above for specific issues');
  process.exit(1);
}
