/**
 * Patches rollup/dist/native.js to use the WASM build instead of the native
 * binary. Required on CPUs (e.g. Haswell i7-4510U) that lack the instruction
 * set the Rollup 4 linux-x64-gnu binary was compiled against.
 */
const fs = require('fs')
const path = require('path')

const rollupNative = path.resolve('node_modules/rollup/dist/native.js')
const wasmNative = path.resolve('node_modules/@rollup/wasm-node/dist/native.js')

if (!fs.existsSync(rollupNative)) {
  console.log('[patch-rollup-wasm] rollup/dist/native.js not found — skipping')
  process.exit(0)
}

if (!fs.existsSync(wasmNative)) {
  console.log('[patch-rollup-wasm] @rollup/wasm-node/dist/native.js not found — skipping')
  process.exit(0)
}

const patch = `// Redirected by scripts/patch-rollup-wasm.cjs (WASM fallback for old CPUs)
// Named exports must be explicit so Node.js CJS->ESM named-export detection works.
const wasm = require('@rollup/wasm-node/dist/native.js');
exports.parse = wasm.parse;
exports.parseAsync = wasm.parseAsync;
exports.xxhashBase64Url = wasm.xxhashBase64Url;
exports.xxhashBase36 = wasm.xxhashBase36;
exports.xxhashBase16 = wasm.xxhashBase16;
`

fs.writeFileSync(rollupNative, patch)
console.log('[patch-rollup-wasm] ✓ rollup/dist/native.js now points to @rollup/wasm-node')
