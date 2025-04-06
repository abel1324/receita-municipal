-- Verifica se a extensão uuid-ossp está instalada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria a tabela de órgãos
CREATE TABLE orgaos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('provincial', 'municipal', 'comunal')),
  orgao_superior_id UUID REFERENCES orgaos(id),
  ativo BOOLEAN DEFAULT true
);

-- Cria a tabela de usuários
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  nivel_acesso VARCHAR(50) NOT NULL CHECK (nivel_acesso IN ('admin', 'gestor', 'operador')),
  orgao_id UUID REFERENCES orgaos(id),
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_acesso TIMESTAMP WITH TIME ZONE
); 