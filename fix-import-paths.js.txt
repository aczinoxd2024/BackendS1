const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, 'src');
const FILE_EXTENSION = '.ts';

function fixImportPath(content) {
  return content.replace(/from ['"]src\/([^'"]+)['"]/g, "from '$1'");
}

function processDirectory(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(FILE_EXTENSION)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const fixedContent = fixImportPath(content);
      fs.writeFileSync(fullPath, fixedContent, 'utf8');
    }
  }
}

// Ejecutar
console.log('🛠️ Corrigiendo imports con src/... en el proyecto...');
processDirectory(BASE_DIR);
console.log('✅ Corrección completa.');
