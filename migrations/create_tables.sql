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

CREATE TABLE tipos_servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT true
);

CREATE TABLE receitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orgao_id UUID REFERENCES orgaos(id) NOT NULL,
  tipo_servico_id UUID REFERENCES tipos_servicos(id) NOT NULL,
  quantidade INTEGER NOT NULL,
  valor_unitario DECIMAL(15, 2) NOT NULL,
  valor_total DECIMAL(15, 2) NOT NULL,
  data_recebimento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_registro_id UUID REFERENCES usuarios(id) NOT NULL,
  referencia VARCHAR(100),
  observacoes TEXT
);

CREATE TABLE relatorios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  data_geracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_id UUID REFERENCES usuarios(id) NOT NULL,
  filtros JSONB,
  resultados JSONB
);

