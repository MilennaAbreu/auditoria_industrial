const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./db');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Import models
const Setor = require('./models/Setor');

// Connect and start server
sequelize.authenticate()
  .then(() => {
    console.log('Connected to Postgres DB');
    // Basic routes
    app.get('/api/setores', async (req, res) => {
      const setores = await Setor.findAll();
      res.json(setores);
    });

    app.post('/api/setores', async (req, res) => {
      const novo = await Setor.create({ nome: req.body.nome });
      res.status(201).json(novo);
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`API running on port ${PORT}`));
  })
  .catch(err => console.error('DB connection error:', err));
