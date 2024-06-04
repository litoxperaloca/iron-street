const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const sourcePatterns = [
  'src/app/pages/**/*.html',
  'src/app/pages/**/*.ts'
];

// Función para encontrar y reemplazar textos
const replaceTextWithTranslateKey = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Regex para encontrar textos en HTML
  const htmlTextRegex = />([^<]+)</g;

  let match;
  while ((match = htmlTextRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text && !/^[{}]+$/.test(text)) {
      const key = text.toUpperCase().replace(/\s+/g, '_').replace(/[¿?]/g, '');
      content = content.replace(match[0], `>{{ '${key}' | translate }}<`);
    }
  }

  // Regex para encontrar textos en TypeScript (dentro de comillas)
  const tsTextRegex = /'(.*?)'|`(.*?)`|"(.*?)"/g;
  while ((match = tsTextRegex.exec(content)) !== null) {
    const text = (match[1] || match[2] || match[3]).trim();
    if (text && !/^[{}]+$/.test(text)) {
      const key = text.toUpperCase().replace(/\s+/g, '_').replace(/[¿?]/g, '');
      content = content.replace(match[0], `'${key}'`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Processed ${filePath}`);
};

// Buscar archivos usando glob y modificar textos
sourcePatterns.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: path.resolve(__dirname) });
  if (files.length === 0) {
    console.log(`No files found for pattern ${pattern}`);
  } else {
    files.forEach(filePath => {
      replaceTextWithTranslateKey(path.resolve(__dirname, filePath));
    });
  }
});

console.log('Textos modificados correctamente.');
