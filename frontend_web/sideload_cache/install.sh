#!/bin/bash
npm config delete proxy
npm config delete https-proxy
unset HTTP_PROXY
unset HTTPS_PROXY
npm install ./lucide-react-0.562.0.tgz ./tailwindcss-4.1.18.tgz ./postcss-8.5.6.tgz ./nanoid-5.1.6.tgz ./picocolors-1.1.1.tgz ./source-map-js-1.2.1.tgz ./autoprefixer-10.4.23.tgz ./browserslist-4.28.1.tgz ./baseline-browser-mapping-2.9.14.tgz ./caniuse-lite-1.0.30001764.tgz ./electron-to-chromium-1.5.267.tgz ./node-releases-2.0.27.tgz ./update-browserslist-db-1.2.3.tgz ./escalade-3.2.0.tgz ./fraction.js-5.3.4.tgz ./postcss-value-parser-4.2.0.tgz --save-dev --legacy-peer-deps --no-audit --no-fund