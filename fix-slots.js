/**
 * Vue 2 → Vue 3 slot syntax migration.
 * Transforms:
 *   <tr slot="heading">...</tr>        → <template #heading><tr>...</tr></template>
 *   <tr slot-scope="{ index, row }">   → <template #default="{ index, row }"><tr>...</tr></template>
 *   <template slot-scope="scope">      → <template #default="scope">
 *   <template slot="name" slot-scope="scope"> → <template #name="scope">
 *   <span slot="label">text</span>     → <template #label>text</template>
 */
const fs = require('fs');
const path = require('path');

const PROJECT = __dirname;

/**
 * Find the index of the first '>' not inside double or single quoted strings.
 * Used to locate the end of an opening HTML tag.
 */
function findUnquotedGt(str) {
    let inD = false, inS = false;
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === '"' && !inS) inD = !inD;
        else if (c === "'" && !inD) inS = !inS;
        else if (c === '>' && !inD && !inS) return i;
    }
    return -1;
}

/**
 * Find the line index of the </tr> that closes the <tr> opened before `from`.
 * Tracks depth to handle nested <tr> elements.
 */
function findClosingTr(lines, from) {
    let depth = 1;
    for (let i = from; i < lines.length; i++) {
        const l = lines[i];
        depth += (l.match(/<tr[\s>\/]/g) || []).length;
        depth -= (l.match(/<\/tr>/g) || []).length;
        if (depth <= 0) return i;
    }
    return lines.length - 1;
}

function transformFile(content) {
    // ── Pass 1: simple regex transforms ──────────────────────────────────────

    // <template slot="name" slot-scope="value"> → <template #name="value">
    content = content.replace(
        /<template(\s[^>]*)?\s+slot="([^"]+)"\s+slot-scope="([^"]+)"/g,
        (_, rest, slot, scope) => `<template${rest || ''} #${slot}="${scope}"`
    );
    content = content.replace(
        /<template(\s[^>]*)?\s+slot-scope="([^"]+)"\s+slot="([^"]+)"/g,
        (_, rest, scope, slot) => `<template${rest || ''} #${slot}="${scope}"`
    );

    // <template slot-scope="value"> → <template #default="value">
    content = content.replace(
        /<template\s+slot-scope="([^"]+)"/g,
        '<template #default="$1"'
    );

    // <span slot="label">single-line text</span> → <template #label>text</template>
    content = content.replace(
        /<span\s+slot="label">([^<]*)<\/span>/g,
        '<template #label>$1</template>'
    );

    // ── Pass 2: wrap <tr slot="heading"> and <tr slot-scope="..."> ───────────
    if (!content.includes('slot="heading"') && !content.includes('slot-scope=')) {
        return content;
    }

    const lines = content.split('\n');
    const out = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Only intercept lines that start a <tr> element
        // Match <tr>, <tr >, <tr/> — or <tr alone at end of line (multi-line opening tag)
        if (!line.trimStart().match(/^<tr(?:[\s>\/]|$)/)) {
            out.push(line);
            i++;
            continue;
        }

        // Collect the complete opening <tr...> tag (may span multiple lines)
        let acc = '';
        let j = i;
        let gtPos = -1;

        while (j < lines.length && gtPos === -1) {
            acc += (j > i ? '\n' : '') + lines[j];
            gtPos = findUnquotedGt(acc);
            if (gtPos === -1) j++;
        }

        if (gtPos === -1) {
            // Could not find tag end — output line as-is and move on
            out.push(line);
            i++;
            continue;
        }

        const openTag = acc.substring(0, gtPos + 1);
        const indent = line.match(/^(\s*)/)[1];

        if (openTag.includes('slot="heading"')) {
            // Remove 'slot="heading"' attribute (and any whitespace around it)
            const cleanTag = openTag.replace(/\s+slot="heading"/g, '').replace(/<tr\s+>/g, '<tr>');

            out.push(indent + '<template #heading>');
            cleanTag.split('\n').forEach(l => out.push(l));

            const closeIdx = findClosingTr(lines, j + 1);
            for (let k = j + 1; k <= closeIdx; k++) out.push(lines[k]);
            out.push(indent + '</template>');
            i = closeIdx + 1;

        } else if (openTag.includes('slot-scope=')) {
            // Extract scope value and remove 'slot-scope="..."' attribute
            const m = openTag.match(/slot-scope="([^"]+)"/);
            const scope = m ? m[1] : '{ index, row }';
            const cleanTag = openTag.replace(/\s+slot-scope="[^"]+"/g, '').replace(/<tr\s+>/g, '<tr>');

            out.push(indent + `<template #default="${scope}">`);
            cleanTag.split('\n').forEach(l => out.push(l));

            const closeIdx = findClosingTr(lines, j + 1);
            for (let k = j + 1; k <= closeIdx; k++) out.push(lines[k]);
            out.push(indent + '</template>');
            i = closeIdx + 1;

        } else {
            // Regular <tr> with no slot attributes — output all collected lines as-is
            for (let k = i; k <= j; k++) out.push(lines[k]);
            i = j + 1;
        }
    }

    return out.join('\n');
}

// ── Walk directories ──────────────────────────────────────────────────────────

function walkDir(dir, results) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fp = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
            walkDir(fp, results);
        } else if (entry.isFile() && entry.name.endsWith('.vue')) {
            results.push(fp);
        }
    }
}

const files = [];
walkDir(path.join(PROJECT, 'resources', 'js'), files);
walkDir(path.join(PROJECT, 'modules'), files);

let changed = 0;
const errors = [];

for (const file of files) {
    const orig = fs.readFileSync(file, 'utf8');
    if (!orig.includes('slot-scope') && !orig.includes('slot="heading"')) continue;

    let result;
    try {
        result = transformFile(orig);
    } catch (err) {
        errors.push(`ERROR ${path.relative(PROJECT, file)}: ${err.message}`);
        continue;
    }

    if (result !== orig) {
        fs.writeFileSync(file, result, 'utf8');
        console.log('Fixed: ' + path.relative(PROJECT, file).replace(/\\/g, '/'));
        changed++;
    }
}

if (errors.length) {
    console.error('\nErrors:');
    errors.forEach(e => console.error(' ' + e));
}
console.log(`\nDone. Changed ${changed} files.`);
