/**
 * Vue 2 → Vue 3 mass migration script
 * Run: node scripts/migrate-vue3.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const STATS = { files: 0, changes: 0 }

function walk(dir, ext, cb) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) {
            if (['node_modules', 'vendor', '.git', 'public'].includes(entry.name)) continue
            walk(full, ext, cb)
        } else if (extname(entry.name) === ext) {
            cb(full)
        }
    }
}

function patch(file, transforms) {
    let src = readFileSync(file, 'utf8')
    let out = src
    for (const [pattern, replacement] of transforms) {
        out = out.replace(pattern, replacement)
    }
    if (out !== src) {
        writeFileSync(file, out, 'utf8')
        STATS.files++
        STATS.changes++
        console.log('  PATCHED:', file.replace(ROOT, '').slice(1))
    }
}

// ─── 1. Remove this.$set / Vue.set ────────────────────────────────────────────
console.log('\n[1] Removing $set / Vue.set ...')
walk(ROOT, '.vue', file => {
    patch(file, [
        // this.$set(obj, 'key', value) → obj['key'] = value
        [/this\.\$set\(([^,]+),\s*(['"`][^'"`]+['"`])\s*,\s*([^)]+)\)/g,
         (_,obj,key,val) => `${obj.trim()}[${key}] = ${val.trim()}`],
        // this.$set(arr, idx, val) → arr[idx] = val
        [/this\.\$set\(([^,]+),\s*(\d+)\s*,\s*([^)]+)\)/g,
         (_,arr,idx,val) => `${arr.trim()}[${idx}] = ${val.trim()}`],
        // Vue.set(...) same patterns
        [/Vue\.set\(([^,]+),\s*(['"`][^'"`]+['"`])\s*,\s*([^)]+)\)/g,
         (_,obj,key,val) => `${obj.trim()}[${key}] = ${val.trim()}`],
    ])
})

// ─── 2. .sync → v-model:prop ──────────────────────────────────────────────────
console.log('\n[2] Migrating .sync to v-model:prop ...')
walk(ROOT, '.vue', file => {
    patch(file, [
        // :visible.sync="x" → v-model:visible="x"   (el-dialog, el-drawer)
        [/:visible\.sync=/g, 'v-model:visible='],
        // :propName.sync="x" → v-model:propName="x"
        [/:([a-zA-Z][a-zA-Z0-9_-]*)\.sync=/g, 'v-model:$1='],
    ])
})

// ─── 3. Element UI → Element Plus imports ─────────────────────────────────────
console.log('\n[3] Updating Element UI imports ...')
// In .vue files
walk(ROOT, '.vue', file => {
    patch(file, [
        [/from ['"]element-ui['"]/g, "from 'element-plus'"],
        [/require\(['"]element-ui['"]\)/g, "require('element-plus')"],
        [/from ['"]element-ui\/lib\/locale\/lang\/es['"]/g, "from 'element-plus/es/locale/lang/es'"],
        [/from ['"]element-ui\/lib\/locale['"]/g, "from 'element-plus/es/locale'"],
    ])
})
// In .js files
walk(ROOT, '.js', file => {
    if (file.includes('node_modules') || file.includes('vendor')) return
    patch(file, [
        [/from ['"]element-ui['"]/g, "from 'element-plus'"],
        [/require\(['"]element-ui['"]\)/g, "require('element-plus')"],
        [/from ['"]element-ui\/lib\/locale\/lang\/es['"]/g, "from 'element-plus/es/locale/lang/es'"],
        [/from ['"]element-ui\/lib\/locale['"]/g, "from 'element-plus/es/locale'"],
        [/import ElementUI from 'element-plus'/g, "import ElementPlus from 'element-plus'"],
    ])
})

// ─── 4. Vue filters in templates → $filters.X(...) ────────────────────────────
console.log('\n[4] Migrating template filters ...')
walk(ROOT, '.vue', file => {
    patch(file, [
        // {{ value | toDecimals(n) }} → {{ $filters.toDecimals(value, n) }}
        [/\{\{\s*([^}|]+?)\s*\|\s*toDecimals\(([^)]*)\)\s*\}\}/g,
         (_, v, args) => `{{ $filters.toDecimals(${v.trim()}${args ? ', ' + args : ''}) }}`],
        [/\{\{\s*([^}|]+?)\s*\|\s*toDecimals\s*\}\}/g,
         (_, v) => `{{ $filters.toDecimals(${v.trim()}) }}`],
        // DecimalText
        [/\{\{\s*([^}|]+?)\s*\|\s*DecimalText\(([^)]*)\)\s*\}\}/g,
         (_, v, args) => `{{ $filters.DecimalText(${v.trim()}${args ? ', ' + args : ''}) }}`],
        [/\{\{\s*([^}|]+?)\s*\|\s*DecimalText\s*\}\}/g,
         (_, v) => `{{ $filters.DecimalText(${v.trim()}) }}`],
        // toDate
        [/\{\{\s*([^}|]+?)\s*\|\s*toDate\s*\}\}/g,
         (_, v) => `{{ $filters.toDate(${v.trim()}) }}`],
        // toTime
        [/\{\{\s*([^}|]+?)\s*\|\s*toTime\s*\}\}/g,
         (_, v) => `{{ $filters.toTime(${v.trim()}) }}`],
        // pad
        [/\{\{\s*([^}|]+?)\s*\|\s*pad\(([^)]*)\)\s*\}\}/g,
         (_, v, args) => `{{ $filters.pad(${v.trim()}, ${args}) }}`],
        [/\{\{\s*([^}|]+?)\s*\|\s*pad\s*\}\}/g,
         (_, v) => `{{ $filters.pad(${v.trim()}) }}`],
    ])
})

// ─── 5. Vuex: Vue.use(Vuex) removal from store/index.js ───────────────────────
// (handled in store rewrite below)

console.log(`\nDone. Patched ${STATS.files} files.`)
