'use client';

import { useState, useEffect } from 'react';
import { usuariosTable, orgaosTable } from '../../../lib/database';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [orgaos, setOrgaos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha_hash: '',
    nivel_acesso: 'operador',
    orgao_id: '',
    ativo: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [usuariosData, orgaosData] = await Promise.all([
        usuariosTable.getAll({ apenasAtivos: false }),
        orgaosTable.getAll({ apenasAtivos: true })
      ]);
      
      setUsuarios(usuariosData);
      setOrgaos(orgaosData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Não foi possível carregar os dados. Verifique se as tabelas foram criadas no Supabase.');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Se estiver editando, não envia a senha se estiver vazia
        const updateData = { ...formData };
        if (!updateData.senha_hash) {
          delete updateData.senha_hash;
        }
        await usuariosTable.update(editId, updateData);
      } else {
        await usuariosTable.create(formData);
      }
      
      // Limpar formulário e recarregar dados
      setFormData({
        nome: '',
        email: '',
        senha_hash: '',
        nivel_acesso: 'operador',
        orgao_id: '',
        ativo: true
      });
      setIsEditing(false);
      setEditId(null);
      await loadData();
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      setError(`Erro ao ${isEditing ? 'atualizar' : 'criar'} usuário: ${err.message}`);
    }
  };

  const handleEdit = (usuario) => {
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha_hash: '', // Não exibe a senha atual
      nivel_acesso: usuario.nivel_acesso,
      orgao_id: usuario.orgao_id || '',
      ativo: usuario.ativo
    });
    setIsEditing(true);
    setEditId(usuario.id);
  };

  const handleCancel = () => {
    setFormData({
      nome: '',
      email: '',
      senha_hash: '',
      nivel_acesso: 'operador',
      orgao_id: '',
      ativo: true
    });
    setIsEditing(false);
    setEditId(null);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Gerenciamento de Usuários</h1>
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (error && usuarios.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Gerenciamento de Usuários</h1>
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Usuários</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="nome">
              Nome
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="senha_hash">
              {isEditing ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha'}
            </label>
            <input
              type="password"
              id="senha_hash"
              name="senha_hash"
              value={formData.senha_hash}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={!isEditing}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="nivel_acesso">
              Nível de Acesso
            </label>
            <select
              id="nivel_acesso"
              name="nivel_acesso"
              value={formData.nivel_acesso}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="admin">Administrador</option>
              <option value="gestor">Gestor</option>
              <option value="operador">Operador</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="orgao_id">
              Órgão
            </label>
            <select
              id="orgao_id"
              name="orgao_id"
              value={formData.orgao_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um órgão</option>
              {orgaos.map(orgao => (
                <option key={orgao.id} value={orgao.id}>
                  {orgao.nome} ({orgao.tipo})
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="ativo"
              name="ativo"
              checked={formData.ativo}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-gray-700" htmlFor="ativo">
              Ativo
            </label>
          </div>
          
          <div className="flex justify-end gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              {isEditing ? 'Atualizar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Lista de Usuários</h2>
        
        {usuarios.length === 0 ? (
          <p>Nenhum usuário cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Nível de Acesso</th>
                  <th className="px-4 py-2 text-left">Órgão</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(usuario => (
                  <tr key={usuario.id} className="border-t border-gray-200">
                    <td className="px-4 py-2">{usuario.nome}</td>
                    <td className="px-4 py-2">{usuario.email}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        usuario.nivel_acesso === 'admin' ? 'bg-purple-100 text-purple-800' :
                        usuario.nivel_acesso === 'gestor' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {usuario.nivel_acesso === 'admin' ? 'Administrador' :
                         usuario.nivel_acesso === 'gestor' ? 'Gestor' : 'Operador'}
                      </span>
                    </td>
                    <td className="px-4 py-2">{usuario.orgaos?.nome || 'N/A'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleEdit(usuario)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm mr-2"
                      >
                        Editar
                      </button>
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