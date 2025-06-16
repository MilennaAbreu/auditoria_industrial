    require('dotenv').config();

    const express = require('express');
    const cors    = require('cors');
    const { Pool } = require('pg');

    const app = express();

    // Habilita CORS lendo os domínios permitidos de variáveis de ambiente
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

    app.use(cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        optionsSuccessStatus: 200,
        credentials: true
    }));

    app.options('*', cors());

    app.use(express.json());


    // Configuração da pool usando variáveis de ambiente

   // const useSSL = process.env.SSL === 'true';

    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: parseInt(process.env.DB_PORT, 10),
        ssl: false // <- FORÇA CONEXÃO SEM SSL
    });




    pool.connect()
        .then(() => console.log("✅ Conectado ao banco PostgreSQL com sucesso"))
        .catch(err => {
            console.error("❌ Falha ao conectar no banco:", err);
            process.exit(1); // força o app a parar se falhar
        });


    // Rota de health check
    app.get('/health', async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT NOW() AS now');
            res.json({ dbTime: rows[0].now });
        } catch (err) {
            console.error('❌ Erro no health:', err.stack);
            res.status(500).json({ error: err.message });
        }
    });

    // =======================================================
    // 1) GET /api/auditorias?start=YYYY-MM-DD&end=YYYY-MM-DD
    //    Lista auditorias no intervalo de datas
    // =======================================================
    app.get('/api/auditorias', async (req, res) => {
        const { start, end } = req.query;
        try {
            let query = `
                SELECT
                    a.id,
                    a.data_auditoria,
                    a.setor_id,
                    s.nome AS setor_nome,
                    a.nome_gestor,
                    a.nota,
                    a.observacoes_gerais AS observacoes
                FROM auditoria AS a
                         JOIN setor AS s ON s.id = a.setor_id
            `;
            const params = [];

            if (start && end) {
                query += ' WHERE a.data_auditoria BETWEEN $1 AND $2';
                params.push(start, end);
            } else if (start) {
                query += ' WHERE a.data_auditoria >= $1';
                params.push(start);
            } else if (end) {
                query += ' WHERE a.data_auditoria <= $1';
                params.push(end);
            }

            query += ' ORDER BY a.data_auditoria DESC;';
            const { rows } = await pool.query(query, params);
            res.json(rows);
        } catch (err) {
            console.error('Erro na rota GET /api/auditorias:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    // =======================================================
    // 2) GET /api/auditorias/:id
    //    Busca dados de uma única auditoria pelo ID
    // =======================================================
    app.get('/api/auditorias/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const query = `
                SELECT
                    a.id,
                    a.data_auditoria,
                    a.setor_id,
                    s.nome AS setor_nome,
                    a.nome_gestor,
                    a.nota,
                    a.observacoes_gerais AS observacoes
                FROM auditoria AS a
                         JOIN setor AS s ON s.id = a.setor_id
                WHERE a.id = $1
            `;
            const { rows } = await pool.query(query, [id]);
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Auditoria não encontrada' });
            }
            res.json(rows[0]);
        } catch (err) {
            console.error('Erro na rota GET /api/auditorias/:id:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    // =======================================================
    // 3) POST /api/auditorias
    //    Insere nova auditoria + respostas + conformidades + ações
    // =======================================================
    app.post('/api/auditorias', async (req, res) => {
        const {
            nome_gestor,
            setor_id,
            data_auditoria,
            responses,
            conformidades,
            acoes_corretivas,
            observacoes_gerais
        } = req.body;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 3.1) Insere a auditoria principal e obtém novo ID
            const insertAud = `
                INSERT INTO auditoria
                    (nome_gestor, setor_id, data_auditoria, observacoes_gerais)
                VALUES ($1, $2, $3, $4)
                    RETURNING id;
            `;
            const { rows: audRows } = await client.query(insertAud, [
                nome_gestor,
                setor_id,
                data_auditoria,
                observacoes_gerais
            ]);
            const newAudId = audRows[0].id;

            // 3.2) Insere auditoria_response (cada checklist_item)
            const insertResp = `
                INSERT INTO auditoria_response
                    (auditoria_id, checklist_item_id, rating, observacao)
                VALUES ($1, $2, $3, $4);
            `;
            for (const r of responses) {
                await client.query(insertResp, [
                    newAudId,
                    r.checklist_item_id,
                    r.rating,
                    r.observacao || null
                ]);
            }

            // 3.3) Insere conformidades ligadas à auditoria
            const insertConf = `
                INSERT INTO conformidade
                    (auditoria_id, descricao, prazo_correcao, resolvido, setor_id)
                VALUES ($1, $2, $3, false, $4);
            `;
            for (const c of conformidades) {
                await client.query(insertConf, [
                    newAudId,
                    c.descricao,
                    c.prazo_correcao,
                    setor_id
                ]);
            }

            // 3.4) Insere ações corretivas
            const insertAcao = `
                INSERT INTO acao_corretiva
                    (auditoria_id, descricao)
                VALUES ($1, $2);
            `;
            for (const a of acoes_corretivas) {
                await client.query(insertAcao, [
                    newAudId,
                    a.descricao
                ]);
            }

            // 3.5) Atualiza média de nota na tabela auditoria
            const updateNota = `
                UPDATE auditoria
                SET nota = (
                    SELECT AVG(rating)::numeric
                    FROM auditoria_response
                    WHERE auditoria_id = $1
                )
                WHERE id = $1;
            `;
            await client.query(updateNota, [newAudId]);

            await client.query('COMMIT');
            res.status(201).json({ id: newAudId });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Erro na rota POST /api/auditorias:', err);
            res.status(500).json({ error: 'Erro interno do servidor', detail: err.message });
        } finally {
            client.release();
        }
    });

    // =======================================================
    // 4) DELETE /api/auditorias/:id
    //    Remove auditoria e todas as dependências
    // =======================================================
    app.delete('/api/auditorias/:id', async (req, res) => {
        const { id } = req.params;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM auditoria_response WHERE auditoria_id = $1', [id]);
            await client.query('DELETE FROM conformidade       WHERE auditoria_id = $1', [id]);
            await client.query('DELETE FROM acao_corretiva     WHERE auditoria_id = $1', [id]);
            await client.query('DELETE FROM auditoria          WHERE id = $1', [id]);
            await client.query('COMMIT');
            res.status(204).send();
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Erro na rota DELETE /api/auditorias/:id:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
        } finally {
            client.release();
        }
    });

    // =======================================================
    // 5) GET /api/checklist-items
    // =======================================================
    app.get('/api/checklist-items', async (req, res) => {
        try {
            const query = `
          SELECT id, categoria, descricao
          FROM checklist_item
          ORDER BY categoria, id;
        `;
            const { rows } = await pool.query(query);
            res.json(rows);
        } catch (err) {
            console.error('Erro na rota GET /api/checklist-items:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    // =======================================================
    // 6) GET /api/auditorias/:id/responses
    // =======================================================
    app.get('/api/auditorias/:id/responses', async (req, res) => {
        const { id } = req.params;
        try {
            const query = `
          SELECT
            ci.categoria,
            ci.descricao AS item_descricao,
            ar.rating,
            ar.observacao
          FROM auditoria_response AS ar
          JOIN checklist_item AS ci ON ci.id = ar.checklist_item_id
          WHERE ar.auditoria_id = $1
          ORDER BY ci.categoria, ci.id;
        `;
            const { rows } = await pool.query(query, [id]);
            res.json(rows);
        } catch (err) {
            console.error('Erro na rota GET /api/auditorias/:id/responses:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    // =======================================================
    // 7) GET /api/setores
    // =======================================================
    app.get('/api/setores', async (req, res) => {
        try {
            const { rows } = await pool.query(`
          SELECT id, nome
          FROM setor
          ORDER BY nome;
        `);
            res.json(rows);
        } catch (err) {
            console.error('Erro na rota GET /api/setores:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    // =======================================================
    // 8) GET /api/conformidades/setor/:setor_id
    // =======================================================
    app.get('/api/conformidades/setor/:setor_id', async (req, res) => {
        const { setor_id } = req.params;
        try {
            const query = `
          SELECT id, descricao, prazo_correcao, resolvido, auditoria_id
          FROM conformidade
          WHERE setor_id = $1
            AND resolvido = false
          ORDER BY prazo_correcao;
        `;
            const { rows } = await pool.query(query, [setor_id]);
            res.json(rows);
        } catch (err) {
            console.error('Erro na rota GET /api/conformidades/setor/:setor_id:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    // =======================================================
    // 9) PATCH /api/conformidades/:id
    // =======================================================
    app.patch('/api/conformidades/:id', async (req, res) => {
        const { id } = req.params;
        const { resolvido } = req.body;
        try {
            await pool.query(
                'UPDATE conformidade SET resolvido = $1 WHERE id = $2',
                [resolvido, id]
            );
            res.json({ success: true });
        } catch (err) {
            console.error('Erro na rota PATCH /api/conformidades/:id:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    // =======================================================
    // 10) GET /api/auditorias/:id/conformidades
    // =======================================================
    app.get('/api/auditorias/:id/conformidades', async (req, res) => {
        const { id } = req.params;
        try {
            const query = `
                SELECT
                    descricao,
                    prazo_correcao,
                    resolvido
                FROM conformidade
                WHERE auditoria_id = $1
                ORDER BY prazo_correcao;
            `;
            const { rows } = await pool.query(query, [id]);
            res.json(rows);
        } catch (err) {
            console.error('Erro na rota GET /api/auditorias/:id/conformidades:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    // =======================================================
    // 11) GET /api/auditorias/:id/acoes-corretivas
    // =======================================================
    app.get('/api/auditorias/:id/acoes-corretivas', async (req, res) => {
        const { id } = req.params;
        try {
            const query = `
          SELECT descricao
          FROM acao_corretiva
          WHERE auditoria_id = $1;
        `;
            const { rows } = await pool.query(query, [id]);
            res.json(rows);
        } catch (err) {
            console.error('Erro na rota GET /api/auditorias/:id/acoes-corretivas:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    // Inicia o servidor na porta alocada pelo cPanel
    const PORT = parseInt(process.env.PORT, 10) || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
