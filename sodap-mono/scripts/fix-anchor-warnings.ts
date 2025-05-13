#!/usr/bin/env ts-node
/**
 * Script to fix common Anchor program warnings
 * 
 * This script addresses the following issues:
 * 1. Unused variables (prefix with underscore)
 * 2. Unused imports (remove or comment out)
 * 3. Unnecessary mutable variables
 * 
 * Usage:
 * ts-node fix-anchor-warnings.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Paths
const PROGRAMS_DIR = path.join(__dirname, '..', 'programs', 'sodap', 'src');

// Function to fix unused variables by prefixing them with underscore
function fixUnusedVariables(filePath: string): void {
  console.log(`Fixing unused variables in ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Common patterns for unused variables in Rust
  const patterns = [
    { regex: /(\s+)ctx: Context<([^>]+)>,/g, replacement: '$1_ctx: Context<$2>,' },
    { regex: /(\s+)root_password: String,/g, replacement: '$1_root_password: String,' },
    { regex: /(\s+)store_id: Pubkey,/g, replacement: '$1_store_id: Pubkey,' },
    { regex: /let signer_seeds = &\[&escrow_seeds\[..\]\];/g, replacement: 'let _signer_seeds = &[&escrow_seeds[..]];' },
  ];
  
  // Apply all patterns
  patterns.forEach(pattern => {
    content = content.replace(pattern.regex, pattern.replacement);
  });
  
  // Fix unnecessary mutable variables
  content = content.replace(/let mut (loyalty_mint|escrow) =/g, 'let $1 =');
  
  fs.writeFileSync(filePath, content);
}

// Function to fix unused imports
function fixUnusedImports(filePath: string): void {
  console.log(`Fixing unused imports in ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Comment out unused imports
  const unusedImports = [
    'use crate::error::CustomError;',
    'use crate::types::*;',
    'use crate::error;',
    'pub use admin::*;',
    'pub use loyalty::*;',
    'pub use product::*;',
    'pub use store::*;',
    'pub use user::*;',
    'pub use user_wallet::*;',
    'pub use product::PurchaseCart;',
  ];
  
  unusedImports.forEach(importStmt => {
    content = content.replace(
      new RegExp(`^(\\s*)${importStmt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'gm'),
      '$1// $&'
    );
  });
  
  fs.writeFileSync(filePath, content);
}

// Main function to fix all issues
async function main() {
  console.log('Starting to fix Anchor program warnings...');
  
  // Find all Rust files
  const rustFiles: string[] = [];
  
  function findRustFiles(dir: string) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findRustFiles(filePath);
      } else if (file.endsWith('.rs')) {
        rustFiles.push(filePath);
      }
    }
  }
  
  findRustFiles(PROGRAMS_DIR);
  
  // Fix issues in each file
  for (const file of rustFiles) {
    fixUnusedVariables(file);
    fixUnusedImports(file);
  }
  
  console.log('Finished fixing warnings. Running cargo fix to address remaining issues...');
  
  try {
    // Run cargo fix to address remaining issues
    execSync('cd programs/sodap && cargo fix --allow-dirty', { stdio: 'inherit' });
    console.log('Cargo fix completed successfully');
  } catch (error) {
    console.error('Error running cargo fix:', error);
  }
  
  console.log('All fixes applied. Please rebuild the program with `anchor build`');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
