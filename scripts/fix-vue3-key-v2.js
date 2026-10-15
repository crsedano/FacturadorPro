/**
 * Fix Vue 3: :key must be on <template v-for>, not on child elements.
 * Handles templates with multiple attributes (v-for + v-if, etc.)
 * and comments between template and child.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const result = execSync(
    'git ls-files -- "*.vue"',
    { cwd: path.join(__dirname, '..'), encoding: 'utf8' }
);
const files = result.trim().split('\n').filter(Boolean);
let totalFixed = 0;

for (const relPath of files) {
    const filePath = path.join(__dirname, '..', relPath);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Find <template ...v-for...> without :key already present,
    // followed by optional whitespace/comments, then a child element with :key.
    //
    // Match: <template [attrs with v-for but not :key]>
    //        [optional whitespace/comments]
    //        <child-tag [optional attrs] :key="KEY" [optional attrs]>

    let changed = true;
    let iterations = 0;
    while (changed && iterations < 50) {
        changed = false;
        iterations++;

        // Match <template with v-for, possibly other attrs, no :key yet
        // Template opening tag: <template ...> where ... contains v-for but not :key
        const regex = /(<template\b(?=(?:[^>](?!:key))*v-for)[^>]*?)(\s*>)([\s\S]*?)(<[a-zA-Z][a-zA-Z0-9-]*(?:\s+(?!:key)[a-zA-Z:-]+(?:="[^"]*")?)*)\s+(:key="([^"]*)")((?:\s+[a-zA-Z:-]+(?:="[^"]*")?)*\s*)(\/?>)/;

        const match = regex.exec(content);
        if (!match) break;

        const templateAttrs = match[1];  // <template ...attrs...
        const templateClose = match[2];  // >
        const between = match[3];        // content between template > and child
        const childStart = match[4];     // <child attrs-before-key
        const keyAttr = match[5];        // :key="value"
        const keyVal = match[6];         // value
        const childRest = match[7];      // attrs after key
        const childEnd = match[8];       // > or />

        const newContent = `${templateAttrs} :key="${keyVal}"${templateClose}${between}${childStart}${childRest.trim() ? ' ' + childRest.trim() : ''}${childEnd}`;
        content = content.slice(0, match.index) + newContent + content.slice(match.index + match[0].length);
        changed = true;
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', relPath);
        totalFixed++;
    }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
