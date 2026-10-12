const fs = require('fs');
const path = require('path');

// Shim for webpack/lib/SizeFormatHelpers removed in webpack 5.x
// laravel-mix 6.x still references the old path
const shim = path.join(__dirname, '..', 'node_modules', 'webpack', 'lib', 'SizeFormatHelpers.js');

if (fs.existsSync(path.join(__dirname, '..', 'node_modules', 'webpack'))) {
    fs.writeFileSync(
        shim,
        "const formatSize = require('./util/formatSize');\nmodule.exports = { formatSize };\n"
    );
    console.log('[postinstall] webpack/lib/SizeFormatHelpers shim applied');
}
