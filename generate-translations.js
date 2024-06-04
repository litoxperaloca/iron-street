const i18nExtract = require('i18n-extract');
const fs = require('fs-extra');
const path = require('path');
const babel = require('@babel/core');
const glob = require('glob');

const locales = ['en', 'es', 'pt'];
const translationsDir = path.join(__dirname, 'src/assets/i18n');
const sourcePatterns = [
  //path.join(__dirname, 'src/**/*.ts'),
  path.join(__dirname, 'src/**/*.html'),
  //path.join(__dirname, 'src/app/**/*.ts'),
  path.join(__dirname, 'src/app/**/*.html'),
  path.join(__dirname, 'src/app/services/**/*.html'),
  //path.join(__dirname, 'src/app/services/**/*.ts'),
  path.join(__dirname, 'src/app/pages/**/*.html'),
  //path.join(__dirname, 'src/app/pages/**/*.ts'),
  path.join(__dirname, 'src/app/modals/**/*.html')
  //path.join(__dirname, 'src/app/modals/**/*.ts')
];

// Configuración de Babel
const babelOptions = {
  presets: ['@babel/preset-env', '@babel/preset-typescript'],
  plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]]
};

// Función para procesar archivos con Babel
const processFileWithBabel = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return babel.transformSync(content, { ...babelOptions, filename: filePath }).code;
};

// Función para extraer claves de traducción con Babel
const extractWithBabel = (files) => {
  return files.flatMap((filePath) => {
    const content = processFileWithBabel(filePath);
    return i18nExtract.extractFromCode(content, { marker: 'translate' });
  });
};

// Buscar archivos usando glob y extraer claves de traducción
const extractKeysFromFiles = (patterns) => {
  return patterns.flatMap(pattern => {
    const files = glob.sync(pattern);
    return extractWithBabel(files);
  });
};

// Extrae las claves de traducción
const keys = extractKeysFromFiles(sourcePatterns);

// Convierte las claves a un formato de objeto
const translationObject = keys.reduce((acc, key) => {
  acc[key.key] = key.key;
  return acc;
}, {});

// Escribe los archivos de traducción
locales.forEach((locale) => {
  const filePath = path.join(translationsDir, `${locale}.json`);
  fs.ensureFileSync(filePath);
  const existingTranslations = fs.existsSync(filePath) ? fs.readJsonSync(filePath) : {};
  const newTranslations = { ...translationObject, ...existingTranslations };
  fs.writeJsonSync(filePath, newTranslations, { spaces: 2 });
});

console.log('Traducciones generadas correctamente.');
