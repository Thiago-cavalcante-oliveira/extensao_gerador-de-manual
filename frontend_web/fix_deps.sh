#!/bin/bash

# Clear local config to be safe
npm config delete proxy
npm config delete https-proxy
npm config delete registry

# Define Proxy with correct encoding
# '!!' matches %21%21
export HTTP_PROXY='http://thiago.tco:Aresluci01%21%21@proxy.pmfi.pr.gov.br:8080'
export HTTPS_PROXY='http://thiago.tco:Aresluci01%21%21@proxy.pmfi.pr.gov.br:8080'
export NO_PROXY='localhost,127.0.0.1,.pmfi.pr.gov.br'

echo "🔹 Installing with ENV Proxy: $HTTP_PROXY"

# Registry
npm config set registry https://registry.npmjs.org/

echo "🔹 Installing Tailwind Dependencies..."
npm install -D tailwindcss postcss autoprefixer

echo "Done."
