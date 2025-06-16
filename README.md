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
