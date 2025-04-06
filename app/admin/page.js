'use client';

import { useState, useEffect } from 'react';
import { orgaosTable, usuariosTable } from '../../lib/database';

export default function AdminPage() {
  const [orgaos, setOrgaos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [orgaosData, usuariosData] = await Promise.all([
          orgaosTable.getAll(),
          usuariosTable.getAll()
        ]);
        
        setOrgaos(orgaosData);
        setUsuarios(usuariosData);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Não foi possível carregar os dados. Verifique se as tabelas foram criadas no Supabase.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Administração</h1>
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Administração</h1>
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
        <p className="mb-4">Para criar as tabelas necessárias no Supabase:</p>
        <ol className="list-decimal pl-5 mb-4">
          <li>Acesse o dashboard do Supabase</li>
          <li>Vá para a seção "SQL Editor"</li>
          <li>Crie um novo script</li>
          <li>Cole o código SQL abaixo</li>
          <li>Execute o script</li>
        </ol>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {`-- Verifica se a extensão uuid-ossp está instalada
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
);`}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Administração</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Órgãos</h2>
        {orgaos.length === 0 ? (
          <p>Nenhum órgão cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {orgaos.map(orgao => (
                  <tr key={orgao.id} className="border-t border-gray-200">
                    <td className="px-4 py-2">{orgao.nome}</td>
                    <td className="px-4 py-2">{orgao.tipo}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${orgao.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {orgao.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Usuários</h2>
        {usuarios.length === 0 ? (
          <p>Nenhum usuário cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Nível de Acesso</th>
                  <th className="px-4 py-2 text-left">Órgão</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(usuario => (
                  <tr key={usuario.id} className="border-t border-gray-200">
                    <td className="px-4 py-2">{usuario.nome}</td>
                    <td className="px-4 py-2">{usuario.email}</td>
                    <td className="px-4 py-2">{usuario.nivel_acesso}</td>
                    <td className="px-4 py-2">{usuario.orgaos?.nome || 'N/A'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 