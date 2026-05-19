-- Ativa o suporte a Chaves Estrangeiras no SQLite
PRAGMA foreign_keys = ON;

-- 1. TABELA CLIENTE
CREATE TABLE IF NOT EXISTS Cliente (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_completo VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    cpf VARCHAR(14) UNIQUE NOT NULL
);

-- 2. TABELA PET
CREATE TABLE IF NOT EXISTS Pet (
    id_pet INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente INTEGER NOT NULL,
    nome VARCHAR(50) NOT NULL,
    especie VARCHAR(30) NOT NULL, -- Cachorro, Gato
    raca VARCHAR(50),
    idade INTEGER,
    observacoes_saude TEXT, -- Alergias, vacinas, etc.
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente) ON DELETE CASCADE
);

-- 3. TABELA USUARIO (Funcionários)
CREATE TABLE IF NOT EXISTS Usuario (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    email_login VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL
);

-- 4. TABELA AGENDAMENTO
CREATE TABLE IF NOT EXISTS Agendamento (
    id_agendamento INTEGER PRIMARY KEY AUTOINCREMENT,
    id_pet INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    data_agendamento DATE NOT NULL,
    horario TIME NOT NULL,
    tipo_servico VARCHAR(100) NOT NULL, -- Banho, Tosa Completa
    status_atual VARCHAR(50) DEFAULT 'Aguardando', -- Aguardando, Em atendimento, Finalizado
    FOREIGN KEY (id_pet) REFERENCES Pet(id_pet) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

-- 5. TABELA REGISTRO JORNADA (Timeline)
CREATE TABLE IF NOT EXISTS Registro_Jornada (
    id_registro INTEGER PRIMARY KEY AUTOINCREMENT,
    id_agendamento INTEGER NOT NULL,
    etapa_jornada VARCHAR(100) NOT NULL, -- Chegou, Banho Iniciado, etc.
    horario_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    nota_funcionario TEXT,
    FOREIGN KEY (id_agendamento) REFERENCES Agendamento(id_agendamento) ON DELETE CASCADE
);