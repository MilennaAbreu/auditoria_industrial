# Configuração do Servidor Windows

Este arquivo resume os passos necessários para hospedar a aplicação `auditoria_industrial` em um servidor Windows acessível pela rede interna.

## PostgreSQL
1. Edite `postgresql.conf` e defina:
   ```
   listen_addresses = '*'
   ```
2. No `pg_hba.conf`, permita conexões da rede local. Exemplo:
   ```
   host    all             all             192.168.0.0/24        md5
   ```
3. Reinicie o serviço do PostgreSQL após as alterações.

## Firewall
Abra as seguintes portas no Windows Firewall:
- **5432**: para conexões ao PostgreSQL
- **3000**: para a API Node.js

## Execução da API
Na pasta `backend` execute:
```bash
npm install
npm start
```
O servidor será iniciado em `0.0.0.0:3000`.

## Servindo o Frontend
Na pasta `frontend`:
```bash
npm run build
npx serve -s dist/auditoria -l 80
```
A aplicação ficará disponível em `http://<ip-do-servidor>`.
