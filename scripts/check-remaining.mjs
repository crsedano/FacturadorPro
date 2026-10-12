import { readFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const SKIP = ['node_modules', 'vendor', '.git', 'public', 'scripts']

function walk(dir, ext, cb) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const f = join(dir, e.name)
        if (e.isDirectory()) { if (!SKIP.includes(e.name)) walk(f, ext, cb) }
        else if (extname(e.name) === ext) cb(f)
    }
}

function countStr(ext, needle) {
    let n = 0
    walk(ROOT, ext, f => {
        const src = readFileSync(f, 'utf8')
        const m = src.split(needle).length - 1
        n += m
    })
    return n
}

console.log('this.$set(          :', countStr('.vue', 'this.$set('))
console.log('.sync=              :', countStr('.vue', '.sync='))
console.log('element-ui (.vue)   :', countStr('.vue', 'element-ui'))
console.log('element-ui (.js)    :', countStr('.js',  'element-ui'))
console.log('| toDecimals        :', countStr('.vue', '| toDecimals'))
console.log('| DecimalText       :', countStr('.vue', '| DecimalText'))
console.log('| toDate            :', countStr('.vue', '| toDate'))
console.log('| toTime            :', countStr('.vue', '| toTime'))
console.log('| pad               :', countStr('.vue', '| pad'))
