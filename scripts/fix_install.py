import os
import subprocess
import sys

# Credenciais e Proxy
# Usando a senha exata sem escape de shell, pois em Python strings literais sao seguras
PROXY_USER = "thiago.tco"
PROXY_PASS = "Aresluci01!!" 
PROXY_HOST = "proxy.pmfi.pr.gov.br"
PROXY_PORT = "8080"

# Construindo a URL do Proxy
# Importante: NPM as vezes prefere encoding, as vezes raw. 
# Vamos tentar primeiro URL Encoded para garantir que caracteres especiais nao quebrem a URL
# Testando RAW password pois o curl funcionou com ela crua
# encoded_user = quote(PROXY_USER)
# encoded_pass = quote(PROXY_PASS)

# URL format: http://user:pass@host:port
# VAMOS TENTAR CRU:
proxy_url = f"http://{PROXY_USER}:{PROXY_PASS}@{PROXY_HOST}:{PROXY_PORT}"

print(f"🔹 Configurando Proxy com senha CRUA (Raw)...")
print(f"🔹 Proxy URL (mascarada): http://{PROXY_USER}:***@{PROXY_HOST}:{PROXY_PORT}")

# Copiando env atual e injetando proxies
env = os.environ.copy()
env["HTTP_PROXY"] = proxy_url
env["HTTPS_PROXY"] = proxy_url
env["NO_PROXY"] = "localhost,127.0.0.1,.pmfi.pr.gov.br"

# DiretÃ³rio de execucao
cwd = os.path.join(os.getcwd(), "frontend_web")

# Comandos para limpar e instalar
commands = [
    ["npm", "config", "delete", "proxy"],
    ["npm", "config", "delete", "https-proxy"],
    ["npm", "config", "set", "strict-ssl", "false"],
    # Nao vamos setar proxy via config file para evitar dupla interpretacao, vamos confiar nas ENV VARS
    ["npm", "install", "lucide-react", "recharts", "--verbose"]
]

for cmd in commands:
    print(f"\n🚀 Executando: {' '.join(cmd)}")
    try:
        # shell=False e env explicito garantem que nao haja expansao do bash com !!
        subprocess.run(cmd, cwd=cwd, env=env, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao executar comando: {e}")
        sys.exit(1)

print("\n✅ Instalação concluída com sucesso!")
