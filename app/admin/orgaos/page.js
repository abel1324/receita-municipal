'use client';

import { useState, useEffect } from 'react';
import { orgaosTable } from '../../../lib/database';

export default function OrgaosPage() {
  const [orgaos, setOrgaos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'municipal',
    orgao_superior_id: null,
    ativo: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    loadOrgaos();
  }, []);

  async function loadOrgaos() {
    try {
      setLoading(true);
      const data = await orgaosTable.getAll({ apenasAtivos: false });
      setOrgaos(data);
    } catch (err) {
      console.error('Erro ao carregar órgãos:', err);
      setError('Não foi possível carregar os órgãos. Verifique se a tabela foi criada no Supabase.');
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
        await orgaosTable.update(editId, formData);
      } else {
        await orgaosTable.create(formData);
      }
      
      // Limpar formulário e recarregar dados
      setFormData({
        nome: '',
        tipo: 'municipal',
        orgao_superior_id: null,
        ativo: true
      });
      setIsEditing(false);
      setEditId(null);
      await loadOrgaos();
    } catch (err) {
      console.error('Erro ao salvar órgão:', err);
      setError(`Erro ao ${isEditing ? 'atualizar' : 'criar'} órgão: ${err.message}`);
    }
  };

  const handleEdit = (orgao) => {
    setFormData({
      nome: orgao.nome,
      tipo: orgao.tipo,
      orgao_superior_id: orgao.orgao_superior_id,
      ativo: orgao.ativo
    });
    setIsEditing(true);
    setEditId(orgao.id);
  };

  const handleCancel = () => {
    setFormData({
      nome: '',
      tipo: 'municipal',
      orgao_superior_id: null,
      ativo: true
    });
    setIsEditing(false);
    setEditId(null);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Gerenciamento de Órgãos</h1>
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (error && orgaos.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Gerenciamento de Órgãos</h1>
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Órgãos</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Editar Órgão' : 'Adicionar Novo Órgão'}</h2>
        
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
            <label className="block text-gray-700 mb-2" htmlFor="tipo">
              Tipo
            </label>
            <select
              id="tipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="provincial">Provincial</option>
              <option value="municipal">Municipal</option>
              <option value="comunal">Comunal</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="orgao_superior_id">
              Órgão Superior
            </label>
            <select
              id="orgao_superior_id"
              name="orgao_superior_id"
              value={formData.orgao_superior_id || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Nenhum</option>
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
        <h2 className="text-xl font-semibold mb-4">Lista de Órgãos</h2>
        
        {orgaos.length === 0 ? (
          <p>Nenhum órgão cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-left">Órgão Superior</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orgaos.map(orgao => {
                  const orgaoSuperior = orgaos.find(o => o.id === orgao.orgao_superior_id);
                  
                  return (
                    <tr key={orgao.id} className="border-t border-gray-200">
                      <td className="px-4 py-2">{orgao.nome}</td>
                      <td className="px-4 py-2">{orgao.tipo}</td>
                      <td className="px-4 py-2">{orgaoSuperior ? orgaoSuperior.nome : 'N/A'}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${orgao.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {orgao.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleEdit(orgao)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm mr-2"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 