const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'resources', 'js', 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. First line: require('./bootstrap') -> import './bootstrap'
content = content.replace(/^require\(['"]\.\/bootstrap['"]\);?\n/m, "import './bootstrap'\n");

// 2. All require('path').default -> defineAsyncComponent(() => import('path'))
content = content.replace(/require\((['"][^'"]+['"])\)\.default/g, "defineAsyncComponent(() => import($1))");

// 3. Add defineAsyncComponent to the createApp import
content = content.replace(
    "import { createApp } from 'vue'",
    "import { createApp, defineAsyncComponent } from 'vue'"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done - app.js converted');
