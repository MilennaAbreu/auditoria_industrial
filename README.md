# Projeto Auditoria Industrial

Este repositório contém:

- **frontend/**: Aplicação Angular (removido node_modules e .idea, configurado environment).
- **backend/**: API Node.js/Express com Sequelize para Postgres.

## Estrutura

```
auditoria_full_updated/
│
├── frontend/
│   ├── angular.json
│   ├── package.json
│   ├── src/
│   └── ...
│
├── backend/
│   ├── package.json
│   ├── .env
│   └── src/
│
├── .gitignore
└── README.md
```

## Como rodar

### Backend
```bash
cd backend
npm install
npm run dev  # ou npm start
```

### Frontend
```bash
cd frontend
npm install
npx ng serve
```

Abra http://localhost:4200 e a aplicação estará funcionando, consumindo a API em http://localhost:3000/api.

## Servidor Windows em Rede Local

Para disponibilizar a aplicação em um servidor Windows acessível pela LAN:

1. Configure o arquivo `.env` do backend seguindo o modelo em `backend/.env.example`,
   usando `DB_HOST=SRVAP02FG.frigoias.corp`, `DB_PORT=5432` e `DB_PASS=root`.
2. Altere as configurações do PostgreSQL para aceitar conexões remotas (`postgresql.conf` com `listen_addresses='*'` e `pg_hba.conf` liberando a rede interna).
3. Libere no firewall as portas **5432** (PostgreSQL) e **3000** (Node.js).
4. Inicie a API executando no diretório `backend`:
   ```bash
   npm install
   npm start
   ```
   O servidor escutará em todas as interfaces (`0.0.0.0`).
5. No frontend, ajuste `environment.ts` para apontar para `http://192.168.0.100:3000/api` (já configurado neste repositório). Para gerar os arquivos estáticos e servi-los na porta 80:
   ```bash
   npm run build
   npx serve -s dist/auditoria -l 80
   ```
   Assim a aplicação Angular ficará acessível em `http://192.168.0.100`.

