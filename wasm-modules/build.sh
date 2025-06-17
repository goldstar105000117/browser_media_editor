#!/bin/bash
echo "🦀 Building WASM module..."

# Install wasm-pack if not installed
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the WASM module
wasm-pack build --target web --out-dir ../public/wasm

echo "✅ WASM module built successfully!"
echo "📦 Files generated in public/wasm/"