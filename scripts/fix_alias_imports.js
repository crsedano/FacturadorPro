const fs = require('fs');
const path = require('path');
const glob = require('glob');

const aliases = {
  '@views': 'resources/js/views/tenant',
  '@components': 'resources/js/components',
  '@mixins': 'resources/js/mixins',
  '@helpers': 'resources/js/helpers',
};

const dirs = ['resources/js', 'modules'];
let files = [];
for (const dir of dirs) {
  files = files.concat(glob.sync(dir + '/**/*.{vue,js}', { absolute: true }));
}
const fixes = [];
const root = process.cwd();

for (const file of files) {
  let content;
  try { content = fs.readFileSync(file, 'utf8'); } catch(e) { continue; }
  
  let changed = false;
  let newContent = content;
  
  for (const [alias, aliasPath] of Object.entries(aliases)) {
    const escapedAlias = alias.replace('@', '\@');
    const re = new RegExp('([\'"])(' + escapedAlias + '/[^\'"]+?)([\'"])', 'g');
    newContent = newContent.replace(re, (match, q1, importPath, q2) => {
      if (importPath.match(/\.(vue|js|mjs|ts|json|css|scss)$/)) return match;
      const relative = importPath.replace(alias, aliasPath);
      const resolved = path.resolve(root, relative + '.vue');
      if (fs.existsSync(resolved)) {
        changed = true;
        fixes.push(path.relative(root, file) + ': ' + importPath);
        return q1 + importPath + '.vue' + q2;
      }
      return match;
    });
  }
  
  if (changed) fs.writeFileSync(file, newContent, 'utf8');
}

console.log('Fixed ' + fixes.length + ' alias imports:');
fixes.forEach(f => console.log('  ' + f));
