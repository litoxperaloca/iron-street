const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const sourcePatterns = [
  'src/app/pages/welcome/*.ts'
];

// Regex to find import statements
const importRegex = /(import\s+.*\s+from\s+['"`])([^'"`]+)(['"`];?)/g;

// Function to restore imports
const restoreImports = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  const matches = [...content.matchAll(importRegex)];

  matches.forEach(match => {
    const originalImport = match[2];
    const fixedImport = originalImport.toLowerCase();
    content = content.replace(match[0], `${match[1]}${fixedImport}${match[3]}`);
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Restored imports in ${filePath}`);
};

// Search files using glob and restore imports
sourcePatterns.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: path.resolve(__dirname) });
  if (files.length === 0) {
    console.log(`No files found for pattern ${pattern}`);
  } else {
    files.forEach(filePath => {
      restoreImports(path.resolve(__dirname, filePath));
    });
  }
});

console.log('Imports restored correctly.');
