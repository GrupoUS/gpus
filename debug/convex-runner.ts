#!/usr/bin/env node

/**
 * Convex Function Debug Runner
 * 
 * This script allows running specific Convex functions for debugging purposes.
 * Usage: bun debug/convex-runner.ts <functionName> [args]
 */

import { execSync } from 'child_process';

const functionName = process.argv[2];
const args = process.argv[3] ? JSON.parse(process.argv[3]) : {};

if (!functionName) {
  console.error('Error: Function name required');
  console.log('Usage: bun debug/convex-runner.ts <functionName> [args]');
  process.exit(1);
}

try {
  // Run the specific Convex function with provided arguments
  execSync(
    `bunx convex run ${functionName} --args '${JSON.stringify(args)}'`,
    {
      encoding: 'utf8',
      stdio: 'inherit',
      cwd: process.cwd()
    }
  );
  
  console.log('\n✅ Function executed successfully');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('\n❌ Function execution failed:', message);
  process.exit(1);
}
