#!/bin/bash
# Script de correção para instalação de dependências com Proxy

# Definindo Proxy com escape correto de caracteres (%21 = !)
export HTTP_PROXY='http://thiago.tco:Aresluci01%21%21@proxy.pmfi.pr.gov.br:8080'
export HTTPS_PROXY='http://thiago.tco:Aresluci01%21%21@proxy.pmfi.pr.gov.br:8080'
export NO_PROXY='localhost,127.0.0.1,.pmfi.pr.gov.br'

echo "🔹 Configurando Proxy..."
echo "HTTP_PROXY=$HTTP_PROXY"

cd extension_react

echo "🔹 Limpando configs antigas..."
npm config delete proxy
npm config delete https-proxy

# Forçando config local (opcional, caso o env não baste)
npm config set proxy "$HTTP_PROXY"
npm config set https-proxy "$HTTPS_PROXY"
npm config set strict-ssl false

echo "🔹 Instalando TailwindCSS..."
npm install -D tailwindcss postcss autoprefixer

echo "🔹 Instalando Lucide React..."
npm install lucide-react

echo "✅ Instalação Concluída!"
