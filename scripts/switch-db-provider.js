#!/usr/bin/env node
/**
 * Script to switch Prisma database provider between SQLite and PostgreSQL
 * 
 * Usage:
 *   node scripts/switch-db-provider.js sqlite
 *   node scripts/switch-db-provider.js postgresql
 */

const fs = require('fs');
const path = require('path');

const provider = process.argv[2] || 'sqlite';
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

if (!['sqlite', 'postgresql'].includes(provider)) {
  console.error('❌ Invalid provider. Use "sqlite" or "postgresql"');
  process.exit(1);
}

try {
  let schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Replace the provider line
  if (provider === 'sqlite') {
    schema = schema.replace(
      /provider\s*=\s*"postgresql"/,
      'provider = "sqlite"'
    );
  } else {
    schema = schema.replace(
      /provider\s*=\s*"sqlite"/,
      'provider = "postgresql"'
    );
  }
  
  fs.writeFileSync(schemaPath, schema);
  console.log(`✅ Switched to ${provider} provider`);
} catch (error) {
  console.error('❌ Error switching provider:', error.message);
  process.exit(1);
}
