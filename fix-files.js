const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const tsSourcePatterns = ['src/app/pages/tips/*.ts'];
const htmlSourcePatterns = ['src/app/pages/tips/*.html'];

// Function to fix TypeScript imports
const fixImportsAndComponentMetadata = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Regex to find import statements
  const importRegex = /(import\s+.*\s+from\s+['"`])([^'"`]+)(['"`];?)/g;
  content = content.replace(importRegex, (match, p1, p2, p3) => {
    return `${p1}${p2.toLowerCase()}${p3}`;
  });

  // Regex to find component metadata and fix it
  const componentRegex = /@Component\s*\(\s*{\s*selector\s*:\s*['"`](.*?)['"`]\s*,\s*templateUrl\s*:\s*['"`](.*?)['"`]\s*,\s*styleUrls\s*:\s*\[\s*['"`](.*?)['"`]\s*\]\s*}\s*\)/g;
  content = content.replace(componentRegex, (match, selector, templateUrl, styleUrl) => {
    return `@Component({
  selector: '${selector.toLowerCase()}',
  templateUrl: './${path.basename(templateUrl.toLowerCase())}',
  styleUrls: ['./${path.basename(styleUrl.toLowerCase())}'],
})`;
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Processed TypeScript file: ${filePath}`);
};

// Function to fix HTML attributes
const fixHtmlAttributes = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Regex to find attributes with single quotes
  const attributeRegex = /(\s+\w+=)'([^']*)'/g;
  content = content.replace(attributeRegex, '$1"$2"');

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Processed HTML file: ${filePath}`);
};

// Search TypeScript files using glob and process them
tsSourcePatterns.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: path.resolve(__dirname) });
  if (files.length === 0) {
    console.log(`No TypeScript files found for pattern ${pattern}`);
  } else {
    files.forEach(filePath => {
      fixImportsAndComponentMetadata(path.resolve(__dirname, filePath));
    });
  }
});

// Search HTML files using glob and process them
htmlSourcePatterns.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: path.resolve(__dirname) });
  if (files.length === 0) {
    console.log(`No HTML files found for pattern ${pattern}`);
  } else {
    files.forEach(filePath => {
      fixHtmlAttributes(path.resolve(__dirname, filePath));
    });
  }
});

console.log('Project files fixed correctly.');
