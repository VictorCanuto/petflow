const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Inicializa o aplicativo Express
const app = express();
const PORT = 3000;

// Configurações de segurança e leitura de JSON
app.use(cors());
app.use(express.json());

// 1. Conexão com o Banco de Dados SQLite
const dbPath = path.resolve(__dirname, 'petflow.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite (petflow.db).');
        
        // 2. Leitura e Execução do seu Diagrama ER (schema.sql)
        try {
            const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
            db.exec(schemaSql, (err) => {
                if (err) {
                    console.error('❌ Erro ao criar as tabelas:', err.message);
                } else {
                    console.log('✅ Tabelas verificadas/criadas com sucesso!');
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

//=========================
//CRUD DE CLIENTES
//=========================

// ==========================================
// C - CREATE: Rota para cadastrar um Cliente
// ==========================================
app.post('/clientes', (req, res) => {
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
app.get('/clientes', (req, res) => {
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
app.put('/clientes/:id', (req, res) => {
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
app.delete('/clientes/:id', (req, res) => {
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
app.post('/pets', (req, res) => {
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
app.get('/pets', (req, res) => {
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
app.put('/pets/:id', (req, res) => {
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
app.delete('/pets/:id', (req, res) => {
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

// Liga o servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Back-end rodando em http://localhost:${PORT}`);
});