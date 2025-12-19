#!/bin/bash
# Script de Build via Docker (Bypass de Proxy Local)

# Define o Proxy exatamente como no .env (funcionou pro Docker Compose)
PROXY_URL="http://thiago.tco:Aresluci01%21%21@proxy.pmfi.pr.gov.br:8080"

echo "🐳 Iniciando Build via Docker..."
echo "Isso vai instalar as dependências e gerar a pasta 'dist' usando um container Node.js."

# Roda um container Node temporário
# -v Mapeia a pasta atual
# -w Define workdir
# -e Passa as variáveis de proxy
# -u Usa o seu usuário (para não criar arquivos como root)
sudo docker run --rm \
    -u $(id -u):$(id -g) \
    -v "$(pwd)/extension_react":/app \
    -w /app \
    -e HTTP_PROXY="$PROXY_URL" \
    -e HTTPS_PROXY="$PROXY_URL" \
    node:18-alpine \
    sh -c "npm config set strict-ssl false && \
           echo '📦 Instalando Dependências...' && \
           npm install -D tailwindcss@3 postcss autoprefixer && \
           npm install lucide-react && \
           echo '🚀 Compilando (Build)...' && \
           npm run build"

echo "✅ Processo finalizado! Verifique se a pasta 'dist' foi criada."
