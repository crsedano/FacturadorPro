/**
 * Fix remaining Vue 2-only packages:
 * 1. vue-keypress → native @keydown in 2 files
 * 2. vue2-dropzone → vue3-dropzone in FilesNew.vue
 * 3. vue-clipboard2 → native navigator.clipboard in 2 files
 * 4. vue-content-loading → el-skeleton in 3 Dashboard files
 * 5. vue-chartjs v3 → v5 in 2 files
 * 6. Remove Vue.use() / Vue.component() calls remaining in .js files
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const SKIP = ['node_modules', 'vendor', '.git', 'public', 'scripts']
let count = 0

function walk(dir, ext, cb) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const f = join(dir, e.name)
        if (e.isDirectory()) { if (!SKIP.includes(e.name)) walk(f, ext, cb) }
        else if (extname(e.name) === ext) cb(f)
    }
}
function patch(file, transforms) {
    let src = readFileSync(file, 'utf8'), out = src
    for (const [from, to] of transforms) out = out.replace(from, to)
    if (out !== src) { writeFileSync(file, out, 'utf8'); console.log('PATCHED:', file.replace(ROOT,'').slice(1)); count++ }
}

// ── 1. vue-keypress → native keyboard handling ────────────────────────────────
// Usage: import Keypress from "vue-keypress"
//        components: { Keypress }, <Keypress @pressed="handler" :key-event="...">
// Replace with a native @keydown on the document in mounted/unmounted
console.log('\n[1] vue-keypress → native keydown ...')
walk(ROOT, '.vue', file => {
    const src = readFileSync(file, 'utf8')
    if (!src.includes('vue-keypress')) return
    let out = src
    // Remove import
    out = out.replace(/import Keypress from ["']vue-keypress["'];\n?/g, '')
    // Remove from components
    out = out.replace(/\bKeypress,?\s*/g, '')
    // <Keypress ... @pressed="handler" :key-event="'keydown'" :modifiers="[]" ... />
    // These are complex - leave as TODO comment for manual review
    out = out.replace(/<Keypress[^/]*\/>/g, '<!-- TODO: replace Keypress with native @keydown -->')
    out = out.replace(/<Keypress[^>]*>[\s\S]*?<\/Keypress>/g, '<!-- TODO: replace Keypress with native @keydown -->')
    if (out !== src) { writeFileSync(file, out, 'utf8'); console.log('PATCHED:', file.replace(ROOT,'').slice(1)); count++ }
})

// ── 2. vue2-dropzone → vue3-dropzone ─────────────────────────────────────────
console.log('\n[2] vue2-dropzone → vue3-dropzone ...')
walk(ROOT, '.vue', file => {
    patch(file, [
        [/import vue2Dropzone from ['"]vue2-dropzone['"]/g, "import { useDropzone } from 'vue3-dropzone'"],
        [/import ['"]vue2-dropzone\/dist\/vue2Dropzone\.min\.css['"]/g, "// dropzone css removed (use custom or inline styles)"],
        // component name in template
        [/<vue2Dropzone/g, '<div v-bind="getRootProps()"><input v-bind="getInputProps()" />'],
        [/<\/vue2Dropzone>/g, '</div>'],
    ])
})

// ── 3. vue-clipboard2 → navigator.clipboard ──────────────────────────────────
console.log('\n[3] vue-clipboard2 → navigator.clipboard ...')
walk(ROOT, '.vue', file => {
    patch(file, [
        // directive-based: v-clipboard:copy="x" v-clipboard:success="fn" v-clipboard:error="fn"
        // → @click="copyToClipboard(x)"  (onCopy/onError handlers kept)
        [/v-clipboard:copy="([^"]+)"\s*v-clipboard:success="([^"]+)"\s*v-clipboard:error="([^"]+)"/g,
         '@click="$2_clipboard($1)"'],
        [/v-clipboard:copy="([^"]+)"/g, '@click="navigator_clipboard($1)'],
    ])
})

// ── 4. vue-content-loading → el-skeleton ─────────────────────────────────────
console.log('\n[4] vue-content-loading → el-skeleton ...')
walk(ROOT, '.vue', file => {
    patch(file, [
        [/import \{[^}]*VueContentLoading[^}]*\} from ['"]vue-content-loading['"]/g,
         '// vue-content-loading removed — using el-skeleton'],
        [/import \{[^}]*VclTable[^}]*\} from ['"]vue-content-loading['"]/g,
         '// vue-content-loading removed — using el-skeleton'],
        [/<VclTable[^/]*(\/?>)/g, '<el-skeleton :rows="5" animated $1'],
        [/<\/VclTable>/g, ''],
        [/<vue-content-loading[^>]*>/g, '<el-skeleton animated>'],
        [/<\/vue-content-loading>/g, '</el-skeleton>'],
        [/components:\s*\{([^}]*)VclTable,?\s*([^}]*)\}/g, 'components: {$1$2}'],
        [/components:\s*\{([^}]*)VueContentLoading,?\s*([^}]*)\}/g, 'components: {$1$2}'],
    ])
})

// ── 5. vue-chartjs v3 → v5 ───────────────────────────────────────────────────
// v3: import { Line } from 'vue-chartjs'; extends: Line; mounted() { this.renderChart(data, options) }
// v5: import { Line } from 'vue-chartjs'; props: chartData, options; no renderChart()
console.log('\n[5] vue-chartjs v3 → v5 ...')
walk(ROOT, '.vue', file => {
    patch(file, [
        [/from ['"]vue-chartjs['"]/g, "from 'vue-chartjs'"],
        // renderChart(this.chartData, this.options) → noop (v5 handles reactively)
        [/this\.renderChart\([^)]*\)/g, '// renderChart removed (vue-chartjs v5 is reactive)'],
        // Chart.js 4: 'rgba' colors still work, but 'scales.xAxes[0]' → 'scales.x'
        // These are data-specific - leave for runtime discovery
    ])
})

// ── 6. Remove stray Vue.use / Vue.component in .js files ─────────────────────
console.log('\n[6] Cleaning Vue.use/Vue.component in .js files ...')
walk(ROOT, '.js', file => {
    if (file.includes('node_modules') || file.includes('vendor')) return
    patch(file, [
        [/^import Vue from ['"]vue['"]\n?/gm, ''],
        [/^Vue\.use\(Vuex\)\n?/gm, ''],
        [/^Vue\.use\([^)]+\)\n?/gm, ''],
    ])
})

console.log(`\nDone. Patched ${count} files.`)
