# PHI Webview — imagem única: builda o front (Vite) e roda o backend Node,
# que serve o build estático (/app/dist) + a API que lê o BigQuery.
#
# Feita para o EasyPanel com:
#   - Caminho de Build (contexto) = /        (raiz do repositório)
#   - Arquivo (Dockerfile)        = webview/Dockerfile
# Por isso os COPY abaixo referenciam a pasta "webview/".

FROM node:20-slim

WORKDIR /app

# 1) Dependências do front (cache de camada)
COPY webview/package.json webview/package-lock.json ./
RUN npm install --no-audit --no-fund

# 2) Código do front + build -> /app/dist
COPY webview/ .
RUN npm run build

# 3) Dependências do backend
WORKDIR /app/server
RUN npm install --no-audit --no-fund

# O backend lê as variáveis de ambiente injetadas pelo EasyPanel
# (GCP_SA_KEY, BQ_BILLING_PROJECT, BQ_DATA_PROJECT, PORT).
ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]
