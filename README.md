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

## Configuração do banco de dados

A aplicação backend utiliza variáveis de ambiente para configurar a conexão
com o PostgreSQL. Você pode informar os dados individualmente (`DB_USER`,
`DB_HOST`, `DB_NAME`, `DB_PASS`, `DB_PORT`) ou utilizar a variável
`DATABASE_URL` contendo a string de conexão completa.

Quando a aplicação roda em produção (`NODE_ENV=production`), o SSL será
ativado automaticamente. Para forçar ou desativar esse comportamento, defina a
variável `SSL` como `true` ou `false`.
