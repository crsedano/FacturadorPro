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

    // Strategy: find <template v-for="..."> blocks where the immediate child
    // element has :key="..." anywhere in its opening tag, and move it to template.
    //
    // Pattern: <template v-for="VFOR">\n WHITESPACE<TAG ...multiline... :key="KEY" ...>
    // Fix:     <template v-for="VFOR" :key="KEY">\n WHITESPACE<TAG ...without :key...>

    // Use a stateful approach: find template v-for without :key, then look ahead
    // for the first child element's :key
    let changed = false;

    // Regex: match <template v-for="..."> (without :key already there)
    // followed by whitespace/newlines, then an opening HTML tag that contains :key="..."
    // The opening tag may span multiple lines
    content = content.replace(
        /<template (v-for="[^"]*")>([ \t]*\n[ \t]*)(<[a-zA-Z][a-zA-Z0-9-]*((?:\s+(?!:key)[a-zA-Z:-]+(?:="[^"]*")?)*)\s+:key="([^"]*)"((?:\s+(?!:key)[a-zA-Z:-]+(?:="[^"]*")?)*)(\s*\/?)>)/gs,
        (match, vfor, ws, fullTag, before, key, after, selfClose) => {
            // Remove :key from the child tag
            const newChildTag = fullTag.replace(/\s+:key="[^"]*"/, '');
            changed = true;
            return `<template ${vfor} :key="${key}">${ws}${newChildTag}`;
        }
    );

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', relPath);
        totalFixed++;
    }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
