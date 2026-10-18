#!/usr/bin/env bash
# Empaqueta el proyector 3D con three.js en assets/utilsla-proyector3d.js (sin CDN).
# Uso: fuentes/construir.sh <carpeta con node_modules que tenga three y esbuild>
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
NM="${1:?Indica la carpeta donde están instalados three y esbuild (npm i three@0.170.0 esbuild)}"
cd "$NM"
export NODE_PATH="$NM/node_modules"
npx esbuild "$RAIZ/fuentes/proyector3d.src.js" --bundle --minify --format=iife --global-name=UtilsProyector3D \
  --target=es2019 --legal-comments=none --outfile="$RAIZ/assets/utilsla-proyector3d.js"
