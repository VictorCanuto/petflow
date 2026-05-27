const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

// Inicializa o aplicativo Express
const app = express();
const PORT = 3000;

// Configurações de segurança e leitura de JSON
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do front-end
app.use(express.static(__dirname));

// Middleware de log de requisições
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Segredo para assinatura de tokens (para ambiente local)
const JWT_SECRET = 'petflow-super-secret-key-change-in-prod';

// Função para gerar o hash SHA-256 de uma senha com sal
function hashSenha(senha) {
    const salt = 'petflow-salt-123';
    return crypto.createHmac('sha256', salt).update(senha).digest('hex');
}

// Função para gerar um Token de Sessão assinado (HMAC-SHA256) stateless
function gerarToken(usuario) {
    const payload = {
        id_usuario: usuario.id_usuario,
        email: usuario.email_login,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 horas de validade
    };
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('hex');
    return `${payloadStr}.${signature}`;
}

// Função para validar um Token de Sessão
function validarToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 2) return null;
        
        const [payloadStr, signature] = parts;
        const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('hex');
        
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
            return null;
        }
        
        const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString('utf8'));
        if (Date.now() > payload.exp) {
            return null;
        }
        
        return payload;
    } catch (e) {
        return null;
    }
}

// Middleware de autenticação
function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    
    if (!token) {
        return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
    }
    
    const usuario = validarToken(token);
    if (!usuario) {
        return res.status(401).json({ erro: 'Acesso negado. Token inválido ou expirado.' });
    }
    
    req.usuario = usuario;
    next();
}

// 1. Conexão com o Banco de Dados SQLite
const dbPath = path.resolve(__dirname, 'petflow.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite (petflow.db).');
        
        // Configura a ativação das chaves estrangeiras na conexão do SQLite
        db.run('PRAGMA foreign_keys = ON;', (err) => {
            if (err) {
                console.error('❌ Erro ao ativar foreign keys:', err.message);
            } else {
                console.log('🔑 Chaves estrangeiras ativadas com sucesso no SQLite.');
            }
        });
        
        // 2. Leitura e Execução do seu Diagrama ER (schema.sql)
        try {
            const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
            db.exec(schemaSql, (err) => {
                if (err) {
                    console.error('❌ Erro ao criar as tabelas:', err.message);
                } else {
                    console.log('✅ Tabelas verificadas/criadas com sucesso!');
                    
                    // Carga inicial (seed) do usuário administrador padrão se a tabela estiver vazia
                    db.get("SELECT COUNT(*) as count FROM Usuario", (err, row) => {
                        if (err) {
                            console.error('❌ Erro ao verificar a tabela Usuario:', err.message);
                        } else if (!row || row.count === 0) {
                            const adminEmail = 'admin@petflow.com.br';
                            const adminSenhaHash = hashSenha('admin');
                            
                            db.run("INSERT INTO Usuario (email_login, senha) VALUES (?, ?)", [adminEmail, adminSenhaHash], (err) => {
                                if (err) {
                                    console.error('❌ Erro ao criar usuário admin padrão:', err.message);
                                } else {
                                    console.log('👤 Usuário admin padrão criado com sucesso (admin@petflow.com.br / senha: admin)');
                                }
                            });
                        }
                    });
                }
            });
        } catch (error) {
            console.error('❌ Arquivo schema.sql não encontrado. Crie ele na raiz do projeto.');
        }
    }
});

// Rota de teste simples
app.get('/', (req, res) => {
    res.send('🐾 API do PetFlow está rodando 100%!');
});

// ==========================================
// ROTA DE LOGIN (Autenticação)
// ==========================================
app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
    }
    
    const sql = `SELECT * FROM Usuario WHERE email_login = ?`;
    db.get(sql, [email], (err, usuario) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro interno do servidor.' });
        }
        
        if (!usuario) {
            return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
        }
        
        // Verifica a senha hashada
        const senhaHash = hashSenha(senha);
        if (usuario.senha !== senhaHash) {
            return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
        }
        
        // Gera o token
        const token = gerarToken(usuario);
        res.json({
            mensagem: '🔑 Autenticado com sucesso!',
            token: token
        });
    });
});

//=========================
//CRUD DE CLIENTES
//=========================

// ==========================================
// C - CREATE: Rota para cadastrar um Cliente
// ==========================================
app.post('/clientes', autenticarToken, (req, res) => {
    // 1. Recebe os dados que vieram lá do Front-end (HTML)
    const { nome_completo, telefone, email, cpf } = req.body;

    // 2. Prepara o comando SQL para inserir na tabela
    const sql = `INSERT INTO Cliente (nome_completo, telefone, email, cpf) VALUES (?, ?, ?, ?)`;

    // 3. Executa a ação no banco de dados SQLite
    db.run(sql, [nome_completo, telefone, email, cpf], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(400).json({ erro: 'Erro ao cadastrar. Verifique se o CPF já existe.' });
        }
        
        // 4. Devolve uma resposta de Sucesso!
        res.status(201).json({
            mensagem: '✅ Cliente cadastrado com sucesso!',
            id_cliente: this.lastID
        });
    });
});

// ==========================================
// R - READ: Rota para buscar todos os Clientes
// ==========================================
app.get('/clientes', autenticarToken, (req, res) => {
    // Comando SQL para buscar todos os clientes, do mais novo para o mais antigo
    const sql = `SELECT * FROM Cliente ORDER BY id_cliente DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao buscar clientes.' });
        }
        // Devolve as linhas (rows) da tabela em formato JSON
        res.json(rows);
    });
});

// ==========================================
// U - UPDATE: Rota para atualizar um Cliente
// ==========================================
app.put('/clientes/:id', autenticarToken, (req, res) => {
    const idCliente = req.params.id;
    const { nome_completo, telefone, email, cpf } = req.body;
    
    const sql = `UPDATE Cliente SET nome_completo = ?, telefone = ?, email = ?, cpf = ? WHERE id_cliente = ?`;

    db.run(sql, [nome_completo, telefone, email, cpf, idCliente], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao atualizar. Verifique se o CPF já pertence a outro cliente.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ erro: 'Cliente não encontrado.' });
        }
        res.json({ mensagem: '✏️ Cliente atualizado com sucesso!' });
    });
});

// ==========================================
// D - DELETE: Rota para excluir um Cliente
// ==========================================
app.delete('/clientes/:id', autenticarToken, (req, res) => {
    const idCliente = req.params.id;
    const sql = `DELETE FROM Cliente WHERE id_cliente = ?`;

    db.run(sql, idCliente, function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao tentar excluir o cliente.' });
        }
        // Verifica se alguma linha foi realmente afetada
        if (this.changes === 0) {
            return res.status(404).json({ erro: 'Cliente não encontrado.' });
        }
        res.json({ mensagem: '🗑️ Cliente excluído com sucesso!' });
    });
});

// ==========================================
// CRUD DE PETS
// ==========================================

// 1. C - CREATE: Rota para cadastrar um Pet
app.post('/pets', autenticarToken, (req, res) => {
    const { id_cliente, nome, especie, raca, idade, observacoes_saude } = req.body;

    const sql = `INSERT INTO Pet (id_cliente, nome, especie, raca, idade, observacoes_saude) 
                 VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(sql, [id_cliente, nome, especie, raca, idade, observacoes_saude], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao cadastrar o pet.' });
        }
        res.status(201).json({
            mensagem: '🐕 Pet cadastrado com sucesso!',
            id_pet: this.lastID
        });
    });
});

// 2. R - READ: Rota para buscar todos os Pets (com o nome do dono!)
app.get('/pets', autenticarToken, (req, res) => {
    // Usamos JOIN para trazer os dados do Pet JUNTO com o nome do Tutor
    const sql = `
        SELECT Pet.*, Cliente.nome_completo AS nome_tutor 
        FROM Pet 
        JOIN Cliente ON Pet.id_cliente = Cliente.id_cliente 
        ORDER BY Pet.id_pet DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao buscar pets.' });
        }
        res.json(rows);
    });
});

// 3. U - UPDATE: Atualizar um Pet
app.put('/pets/:id', autenticarToken, (req, res) => {
    const idPet = req.params.id;
    const { id_cliente, nome, especie, raca, idade, observacoes_saude } = req.body;
    
    const sql = `UPDATE Pet SET id_cliente = ?, nome = ?, especie = ?, raca = ?, idade = ?, observacoes_saude = ? WHERE id_pet = ?`;

    db.run(sql, [id_cliente, nome, especie, raca, idade, observacoes_saude, idPet], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao atualizar o pet.' });
        }
        res.json({ mensagem: '✏️ Pet atualizado com sucesso!' });
    });
});

// 4. D - DELETE: Excluir um Pet
app.delete('/pets/:id', autenticarToken, (req, res) => {
    const idPet = req.params.id;
    const sql = `DELETE FROM Pet WHERE id_pet = ?`;

    db.run(sql, idPet, function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao excluir o pet.' });
        }
        res.json({ mensagem: '🗑️ Pet excluído com sucesso!' });
    });
});

// ==========================================
// CRUD DE AGENDAMENTOS
// ==========================================

// 1. R - READ: Buscar todos os agendamentos de uma data específica
app.get('/agendamentos', autenticarToken, (req, res) => {
    const { data } = req.query;
    if (!data) {
        return res.status(400).json({ erro: 'O parâmetro data é obrigatório (formato YYYY-MM-DD).' });
    }

    const sql = `
        SELECT Agendamento.*, 
               Pet.nome AS nome_pet, Pet.especie AS especie_pet, Pet.raca AS raca_pet,
               Cliente.nome_completo AS nome_tutor,
               Usuario.email_login AS email_usuario
        FROM Agendamento
        JOIN Pet ON Agendamento.id_pet = Pet.id_pet
        JOIN Cliente ON Pet.id_cliente = Cliente.id_cliente
        JOIN Usuario ON Agendamento.id_usuario = Usuario.id_usuario
        WHERE Agendamento.data_agendamento = ?
        ORDER BY Agendamento.horario ASC
    `;
    
    db.all(sql, [data], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao buscar agendamentos.' });
        }
        res.json(rows);
    });
});

// 2. C - CREATE: Cadastrar um novo agendamento
app.post('/agendamentos', autenticarToken, (req, res) => {
    const { id_pet, data_agendamento, horario, tipo_servico } = req.body;
    const id_usuario = req.usuario.id_usuario;

    if (!id_pet || !data_agendamento || !horario || !tipo_servico) {
        return res.status(400).json({ erro: 'Todos os campos (id_pet, data_agendamento, horario, tipo_servico) são obrigatórios.' });
    }

    // Verifica se o pet já possui um agendamento no mesmo dia e horário
    const checkSql = `SELECT COUNT(*) as count FROM Agendamento WHERE id_pet = ? AND data_agendamento = ? AND horario = ?`;
    db.get(checkSql, [id_pet, data_agendamento, horario], (checkErr, checkRow) => {
        if (checkErr) {
            console.error(checkErr.message);
            return res.status(500).json({ erro: 'Erro ao verificar disponibilidade do pet.' });
        }
        if (checkRow && checkRow.count > 0) {
            return res.status(400).json({ erro: 'Este pet já possui um agendamento cadastrado para este dia e horário!' });
        }

        const sql = `INSERT INTO Agendamento (id_pet, id_usuario, data_agendamento, horario, tipo_servico, status_atual) 
                     VALUES (?, ?, ?, ?, ?, 'Aguardando')`;

        db.run(sql, [id_pet, id_usuario, data_agendamento, horario, tipo_servico], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ erro: 'Erro ao cadastrar agendamento.' });
            }
            
            const idAgendamento = this.lastID;
            
            // Registra a etapa inicial 'Chegou no Petshop' na jornada
            const sqlJornada = `INSERT INTO Registro_Jornada (id_agendamento, etapa_jornada, nota_funcionario) VALUES (?, 'Chegou no Petshop', NULL)`;
            db.run(sqlJornada, [idAgendamento], function(errJornada) {
                if (errJornada) {
                    console.error('Erro ao registrar etapa inicial na jornada:', errJornada.message);
                }
                res.status(201).json({
                    mensagem: '📅 Agendamento cadastrado com sucesso!',
                    id_agendamento: idAgendamento
                });
            });
        });
    });
});

// 3. U - UPDATE STATUS: Atualizar apenas o status de um agendamento
app.put('/agendamentos/:id/status', autenticarToken, (req, res) => {
    const idAgendamento = req.params.id;
    const { status_atual, etapa_jornada, nota_funcionario } = req.body;

    if (!status_atual) {
        return res.status(400).json({ erro: 'O campo status_atual é obrigatório.' });
    }

    const sql = `UPDATE Agendamento SET status_atual = ? WHERE id_agendamento = ?`;

    db.run(sql, [status_atual, idAgendamento], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao atualizar o status do agendamento.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ erro: 'Agendamento não encontrado.' });
        }

        // Mapeia o status para a etapa da jornada correspondente
        let etapa = etapa_jornada;
        if (!etapa) {
            etapa = 'Chegou no Petshop';
            if (status_atual === 'Em atendimento') {
                etapa = 'Banho Iniciado';
            } else if (status_atual === 'Finalizado') {
                etapa = 'Pronto para buscar!';
            }
        }

        // Inserir registro na tabela Registro_Jornada
        const sqlInsertJornada = `INSERT INTO Registro_Jornada (id_agendamento, etapa_jornada, nota_funcionario) VALUES (?, ?, ?)`;
        db.run(sqlInsertJornada, [idAgendamento, etapa, nota_funcionario || null], function(errJornada) {
            if (errJornada) {
                console.error('Erro ao registrar etapa na jornada:', errJornada.message);
            }
            res.json({ 
                mensagem: '🔄 Status do agendamento atualizado com sucesso e registrado na jornada!'
            });
        });
    });
});

// ROTA PÚBLICA DA JORNADA (Sem autenticarToken)
app.get('/jornada/:id_agendamento', (req, res) => {
    const idAgendamento = req.params.id_agendamento;

    const sqlAgendamento = `
        SELECT Agendamento.*, 
               Pet.nome AS nome_pet, Pet.especie AS especie_pet, Pet.raca AS raca_pet, Pet.idade AS idade_pet, Pet.observacoes_saude AS obs_pet,
               Cliente.nome_completo AS nome_tutor
        FROM Agendamento
        JOIN Pet ON Agendamento.id_pet = Pet.id_pet
        JOIN Cliente ON Pet.id_cliente = Cliente.id_cliente
        WHERE Agendamento.id_agendamento = ?
    `;

    db.get(sqlAgendamento, [idAgendamento], (err, agendamento) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao buscar detalhes da jornada.' });
        }
        if (!agendamento) {
            return res.status(404).json({ erro: 'Jornada não encontrada para o agendamento informado.' });
        }

        const sqlHistorico = `
            SELECT * FROM Registro_Jornada 
            WHERE id_agendamento = ? 
            ORDER BY id_registro ASC
        `;

        db.all(sqlHistorico, [idAgendamento], (errHist, historico) => {
            if (errHist) {
                console.error(errHist.message);
                return res.status(500).json({ erro: 'Erro ao buscar histórico da jornada.' });
            }

            res.json({
                agendamento: agendamento,
                historico: historico
            });
        });
    });
});


// 4. D - DELETE: Excluir um agendamento
app.delete('/agendamentos/:id', autenticarToken, (req, res) => {
    const idAgendamento = req.params.id;
    const sql = `DELETE FROM Agendamento WHERE id_agendamento = ?`;

    db.run(sql, idAgendamento, function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao excluir o agendamento.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ erro: 'Agendamento não encontrado.' });
        }
        res.json({ mensagem: '🗑️ Agendamento excluído com sucesso!' });
    });
});

// ==========================================
// METRICAS DO DASHBOARD
// ==========================================
app.get('/dashboard/metricas', autenticarToken, (req, res) => {
    const { data } = req.query;
    if (!data) {
        return res.status(400).json({ erro: 'O parâmetro data é obrigatório (formato YYYY-MM-DD).' });
    }

    const sql = `
        SELECT 
            COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN status_atual = 'Em atendimento' THEN 1 ELSE 0 END), 0) AS em_atendimento,
            COALESCE(SUM(CASE WHEN status_atual = 'Aguardando' THEN 1 ELSE 0 END), 0) AS aguardando
        FROM Agendamento 
        WHERE data_agendamento = ?
    `;

    db.get(sql, [data], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao buscar métricas do dashboard.' });
        }
        res.json({
            totalAgendados: row.total,
            emAtendimento: row.em_atendimento,
            aguardando: row.aguardando
        });
    });
});

// Liga o servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Back-end rodando em http://localhost:${PORT}`);
});