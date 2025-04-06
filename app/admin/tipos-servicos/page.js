'use client';

import { useState, useEffect } from 'react';
import { tiposServicosTable } from '../../../lib/database';

export default function TiposServicosPage() {
  const [tiposServicos, setTiposServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    ativo: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    loadTiposServicos();
  }, []);

  async function loadTiposServicos() {
    try {
      setLoading(true);
      const data = await tiposServicosTable.getAll({ apenasAtivos: false });
      setTiposServicos(data);
    } catch (err) {
      console.error('Erro ao carregar tipos de serviços:', err);
      setError('Não foi possível carregar os tipos de serviços. Verifique se a tabela foi criada no Supabase.');
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
        await tiposServicosTable.update(editId, formData);
      } else {
        await tiposServicosTable.create(formData);
      }
      
      // Limpar formulário e recarregar dados
      setFormData({
        nome: '',
        descricao: '',
        categoria: '',
        ativo: true
      });
      setIsEditing(false);
      setEditId(null);
      await loadTiposServicos();
    } catch (err) {
      console.error('Erro ao salvar tipo de serviço:', err);
      setError(`Erro ao ${isEditing ? 'atualizar' : 'criar'} tipo de serviço: ${err.message}`);
    }
  };

  const handleEdit = (tipoServico) => {
    setFormData({
      nome: tipoServico.nome,
      descricao: tipoServico.descricao || '',
      categoria: tipoServico.categoria,
      ativo: tipoServico.ativo
    });
    setIsEditing(true);
    setEditId(tipoServico.id);
  };

  const handleCancel = () => {
    setFormData({
      nome: '',
      descricao: '',
      categoria: '',
      ativo: true
    });
    setIsEditing(false);
    setEditId(null);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Gerenciamento de Tipos de Serviços</h1>
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (error && tiposServicos.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Gerenciamento de Tipos de Serviços</h1>
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      </div>
    );
  }

  // Agrupar tipos de serviços por categoria
  const tiposPorCategoria = tiposServicos.reduce((acc, tipo) => {
    if (!acc[tipo.categoria]) {
      acc[tipo.categoria] = [];
    }
    acc[tipo.categoria].push(tipo);
    return acc;
  }, {});

  // Lista de categorias existentes
  const categorias = Object.keys(tiposPorCategoria).sort();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Tipos de Serviços</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Editar Tipo de Serviço' : 'Adicionar Novo Tipo de Serviço'}</h2>
        
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
            <label className="block text-gray-700 mb-2" htmlFor="descricao">
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="categoria">
              Categoria
            </label>
            <div className="flex">
              <input
                type="text"
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                list="categorias-existentes"
              />
              <datalist id="categorias-existentes">
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria} />
                ))}
              </datalist>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Digite uma categoria existente ou crie uma nova.
            </p>
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
        <h2 className="text-xl font-semibold mb-4">Lista de Tipos de Serviços</h2>
        
        {tiposServicos.length === 0 ? (
          <p>Nenhum tipo de serviço cadastrado.</p>
        ) : (
          <div>
            {categorias.map(categoria => (
              <div key={categoria} className="mb-6">
                <h3 className="text-lg font-semibold mb-2 pb-2 border-b">
                  Categoria: {categoria}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Nome</th>
                        <th className="px-4 py-2 text-left">Descrição</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiposPorCategoria[categoria].map(tipo => (
                        <tr key={tipo.id} className="border-t border-gray-200">
                          <td className="px-4 py-2">{tipo.nome}</td>
                          <td className="px-4 py-2">{tipo.descricao || 'N/A'}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs ${tipo.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {tipo.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleEdit(tipo)}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 