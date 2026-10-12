/**
 * Replace mix() helper with @vite() directive in Blade templates.
 * Vite outputs to public/build/ with a manifest; @vite() reads it.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const SKIP = ['node_modules', 'vendor', '.git', 'public']
let count = 0

function walk(dir, ext, cb) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const f = join(dir, e.name)
        if (e.isDirectory()) { if (!SKIP.includes(e.name)) walk(f, ext, cb) }
        else if (f.endsWith(ext)) cb(f)
    }
}

walk(ROOT, '.blade.php', file => {
    let src = readFileSync(file, 'utf8')
    if (!src.includes("mix(")) return

    let out = src

    // Collect all mix() calls on one line that should become @vite([...])
    // Pattern: one or more:
    //   <link ... href="{{ mix('css/app.css') }}" ... />
    //   <script ... src="{{ mix('js/app.js') }}"></script>

    // Replace individual link/script tags that use mix():
    // <link ... href="{{ mix('css/...') }}" ...>  → @vite(['resources/sass/...'])
    // <script ... src="{{ mix('js/...') }}"></script>  → @vite(['resources/js/...'])

    // Map old public paths → vite input paths
    const MAP = {
        'css/app.css':  'resources/sass/style.scss',
        'css/auth.css': 'resources/sass/auth.scss',
        'js/app.js':    'resources/js/app.js',
        'js/vendor.js': null, // extracted by mix, no vite equiv (vite chunks automatically)
    }

    // Remove standalone vendor.js script tags (vite handles code splitting automatically)
    out = out.replace(/<script[^>]*\{\{\s*mix\(['"]js\/vendor\.js['"]\)\s*\}\}[^>]*><\/script>\n?/g, '')

    // Replace <link href="{{ mix('css/app.css') }}" ...> with @vite
    out = out.replace(/<link[^>]*href="\{\{\s*mix\(['"]css\/app\.css['"]\)\s*\}\}"[^>]*>/g,
        "@vite(['resources/js/app.js', 'resources/sass/style.scss'])")

    out = out.replace(/<link[^>]*href="\{\{\s*mix\(['"]css\/auth\.css['"]\)\s*\}\}"[^>]*>/g,
        "@vite(['resources/sass/auth.scss'])")

    // Remove <script src="{{ mix('js/app.js') }}"></script> (already included by @vite above)
    out = out.replace(/<script[^>]*src="\{\{\s*mix\(['"]js\/app\.js['"]\)\s*\}\}"[^>]*><\/script>\n?/g, '')

    // Any remaining mix() calls → @vite(['resources/...'])
    out = out.replace(/\{\{\s*mix\(['"]([^'"]+)['"]\)\s*\}\}/g, (_, p) => {
        const mapped = MAP[p]
        if (mapped) return `@vite(['${mapped}'])`
        return `@vite(['${p}'])` // fallback
    })

    if (out !== src) {
        writeFileSync(file, out, 'utf8')
        console.log('PATCHED:', file.replace(ROOT, '').slice(1))
        count++
    }
})

console.log(`\nDone. Patched ${count} Blade files.`)
