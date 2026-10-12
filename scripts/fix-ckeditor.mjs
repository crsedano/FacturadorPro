/**
 * Migrate vue-ckeditor5 → @ckeditor/ckeditor5-vue
 * Old: import VueCkeditor from 'vue-ckeditor5'; components: { 'vue-ckeditor': VueCkeditor.component }
 *      <vue-ckeditor type="classic" v-model="x" :editors="editors">
 * New: import CKEditor from '@ckeditor/ckeditor5-vue'; components: { ckeditor: CKEditor.component }
 *      <ckeditor :editor="ClassicEditor" v-model="x">
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const SKIP = ['node_modules', 'vendor', '.git', 'public']

function walk(dir, ext, cb) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const f = join(dir, e.name)
        if (e.isDirectory()) { if (!SKIP.includes(e.name)) walk(f, ext, cb) }
        else if (extname(e.name) === ext) cb(f)
    }
}

let count = 0
walk(ROOT, '.vue', file => {
    let src = readFileSync(file, 'utf8')
    if (!src.includes('vue-ckeditor5')) return

    let out = src
    // import
    out = out.replace(/import VueCkeditor from ['"]vue-ckeditor5['"]/g,
        "import CKEditor from '@ckeditor/ckeditor5-vue'")
    // component registration
    out = out.replace(/'vue-ckeditor':\s*VueCkeditor\.component/g,
        "ckeditor: CKEditor.component")
    out = out.replace(/"vue-ckeditor":\s*VueCkeditor\.component/g,
        "ckeditor: CKEditor.component")
    // template: <vue-ckeditor type="classic" v-model="x" :editors="editors">
    out = out.replace(/<vue-ckeditor\b([^>]*?)type="classic"([^>]*?)>/g, (_, pre, post) => {
        // remove :editors="editors" and type="classic", add :editor="ClassicEditor"
        let attrs = (pre + post)
            .replace(/:editors="[^"]*"/g, '')
            .replace(/type="classic"/g, '')
            .trim()
        return `<ckeditor :editor="ClassicEditor" ${attrs}>`
    })
    out = out.replace(/<\/vue-ckeditor>/g, '</ckeditor>')
    // also handle v-model binding in editors data (add ClassicEditor to data if missing)
    // add ClassicEditor to data() if not present
    if (out.includes('ClassicEditor') && !out.includes("ClassicEditor,") && !out.includes("ClassicEditor:")) {
        out = out.replace(/import ClassicEditor from '@ckeditor\/ckeditor5-build-classic'/,
            "import ClassicEditor from '@ckeditor/ckeditor5-build-classic'")
    }
    // remove editors object from data (no longer needed)
    out = out.replace(/editors:\s*\{[^}]*ClassicEditor[^}]*\},?\n?/g, '')

    if (out !== src) {
        writeFileSync(file, out, 'utf8')
        console.log('PATCHED:', file.replace(ROOT, '').slice(1))
        count++
    }
})
console.log(`\nDone. Patched ${count} files.`)
