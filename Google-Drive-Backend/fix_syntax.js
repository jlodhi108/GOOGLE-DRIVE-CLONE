const fs = require('fs');
const files = [
  'controllers/fileController.js',
  'controllers/folderController.js',
  'controllers/shareController.js',
  'services/searchService.js'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\\\`/g, '`');
  content = content.replace(/\\\$/g, '$');
  fs.writeFileSync(f, content);
});
console.log('Syntax fixed.');
