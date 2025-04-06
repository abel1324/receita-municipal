'use client';

import { useState, useEffect } from 'react';
import { receitasTable, orgaosTable, tiposServicosTable } from '../../../lib/database';

export default function ReceitasPage() {
  const [receitas, setReceitas] = useState([]);
  const [orgaos, setOrgaos] = useState([]);
  const [tiposServicos, setTiposServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    orgao_id: '',
    tipo_servico_id: '',
    quantidade: 1,
    valor_unitario: '',
    valor_total: '',
    referencia: '',
    observacoes: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filtros, setFiltros] = useState({
    orgao_id: '',
    tipo_servico_id: '',
    dataInicio: '',
    dataFim: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [receitasData, orgaosData, tiposServicosData] = await Promise.all([
        receitasTable.getAll(),
        orgaosTable.getAll({ apenasAtivos: true }),
        tiposServicosTable.getAll({ apenasAtivos: true })
      ]);
      
      setReceitas(receitasData);
      setOrgaos(orgaosData);
      setTiposServicos(tiposServicosData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Não foi possível carregar os dados. Verifique se as tabelas foram criadas no Supabase.');
    } finally {
      setLoading(false);
    }
  }

  async function loadReceitas() {
    try {
      setLoading(true);
      const { orgao_id, tipo_servico_id, dataInicio, dataFim } = filtros;
      
      const receitasData = await receitasTable.getAll({
        orgaoId: orgao_id || null,
        tipoServicoId: tipo_servico_id || null,
        dataInicio: dataInicio || null,
        dataFim: dataFim || null
      });
      
      setReceitas(receitasData);
    } catch (err) {
      console.error('Erro ao carregar receitas:', err);
      setError('Não foi possível carregar as receitas.');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Calcula automaticamente o valor total quando quantidade ou valor unitário mudam
      if (name === 'quantidade' || name === 'valor_unitario') {
        const quantidade = parseFloat(name === 'quantidade' ? value : prev.quantidade) || 0;
        const valorUnitario = parseFloat(name === 'valor_unitario' ? value : prev.valor_unitario) || 0;
        
        if (quantidade && valorUnitario) {
          newData.valor_total = (quantidade * valorUnitario).toFixed(2);
        }
      }
      
      // Se o valor total for editado diretamente, não recalcula
      if (name === 'valor_total') {
        newData.valor_total = value;
      }
      
      return newData;
    });
  };
  
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
  };
  
  const handleFiltrar = (e) => {
    e.preventDefault();
    loadReceitas();
  };
  
  const limparFiltros = () => {
    setFiltros({
      orgao_id: '',
      tipo_servico_id: '',
      dataInicio: '',
      dataFim: ''
    });
    loadData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Obter o ID do usuário logado (do localStorage)
      const usuarioString = localStorage.getItem('usuario');
      const usuario = usuarioString ? JSON.parse(usuarioString) : null;
      
      if (!usuario || !usuario.id) {
        setError('Usuário não autenticado. Faça login novamente.');
        return;
      }
      
      const receitaData = {
        ...formData,
        usuario_registro_id: usuario.id
      };
      
      if (isEditing) {
        await receitasTable.update(editId, receitaData);
      } else {
        await receitasTable.create(receitaData);
      }
      
      // Limpar formulário e recarregar dados
      setFormData({
        orgao_id: '',
        tipo_servico_id: '',
        quantidade: 1,
        valor_unitario: '',
        valor_total: '',
        referencia: '',
        observacoes: ''
      });
      setIsEditing(false);
      setEditId(null);
      await loadReceitas();
    } catch (err) {
      console.error('Erro ao salvar receita:', err);
      setError(`Erro ao ${isEditing ? 'atualizar' : 'registrar'} receita: ${err.message}`);
    }
  };

  const handleEdit = (receita) => {
    setFormData({
      orgao_id: receita.orgao_id,
      tipo_servico_id: receita.tipo_servico_id,
      quantidade: receita.quantidade,
      valor_unitario: receita.valor_unitario,
      valor_total: receita.valor_total,
      referencia: receita.referencia || '',
      observacoes: receita.observacoes || ''
    });
    setIsEditing(true);
    setEditId(receita.id);
  };

  const handleCancel = () => {
    setFormData({
      orgao_id: '',
      tipo_servico_id: '',
      quantidade: 1,
      valor_unitario: '',
      valor_total: '',
      referencia: '',
      observacoes: ''
    });
    setIsEditing(false);
    setEditId(null);
  };

  // Formatação de valores monetários
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(valor);
  };
  
  // Formatação de data e hora
  const formatarData = (dataISO) => {
    return new Date(dataISO).toLocaleString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !receitas.length) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Gerenciamento de Receitas</h1>
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (error && !receitas.length) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Gerenciamento de Receitas</h1>
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Receitas</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Formulário de filtros */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Filtrar Receitas</h2>
        
        <form onSubmit={handleFiltrar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="orgao_id_filtro">
              Órgão
            </label>
            <select
              id="orgao_id_filtro"
              name="orgao_id"
              value={filtros.orgao_id}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os órgãos</option>
              {orgaos.map(orgao => (
                <option key={orgao.id} value={orgao.id}>
                  {orgao.nome} ({orgao.tipo})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="tipo_servico_id_filtro">
              Tipo de Serviço
            </label>
            <select
              id="tipo_servico_id_filtro"
              name="tipo_servico_id"
              value={filtros.tipo_servico_id}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os tipos</option>
              {tiposServicos.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome} ({tipo.categoria})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="dataInicio">
              Data Inicial
            </label>
            <input
              type="date"
              id="dataInicio"
              name="dataInicio"
              value={filtros.dataInicio}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="dataFim">
              Data Final
            </label>
            <input
              type="date"
              id="dataFim"
              name="dataFim"
              value={filtros.dataFim}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={limparFiltros}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
            >
              Limpar Filtros
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Filtrar
            </button>
          </div>
        </form>
      </div>
      
      {/* Formulário de cadastro/edição */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Editar Receita' : 'Registrar Nova Receita'}</h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="orgao_id">
              Órgão
            </label>
            <select
              id="orgao_id"
              name="orgao_id"
              value={formData.orgao_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione um órgão</option>
              {orgaos.map(orgao => (
                <option key={orgao.id} value={orgao.id}>
                  {orgao.nome} ({orgao.tipo})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="tipo_servico_id">
              Tipo de Serviço
            </label>
            <select
              id="tipo_servico_id"
              name="tipo_servico_id"
              value={formData.tipo_servico_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione um tipo de serviço</option>
              {tiposServicos.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome} ({tipo.categoria})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="quantidade">
              Quantidade
            </label>
            <input
              type="number"
              id="quantidade"
              name="quantidade"
              value={formData.quantidade}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="valor_unitario">
              Valor Unitário (AOA)
            </label>
            <input
              type="number"
              id="valor_unitario"
              name="valor_unitario"
              value={formData.valor_unitario}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="valor_total">
              Valor Total (AOA)
            </label>
            <input
              type="number"
              id="valor_total"
              name="valor_total"
              value={formData.valor_total}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="referencia">
              Referência
            </label>
            <input
              type="text"
              id="referencia"
              name="referencia"
              value={formData.referencia}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Número do documento, etc."
            />
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <label className="block text-gray-700 mb-2" htmlFor="observacoes">
              Observações
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>
          
          <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
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
              {isEditing ? 'Atualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Lista de receitas */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Lista de Receitas</h2>
          {loading && <span className="text-sm text-gray-500">Atualizando...</span>}
        </div>
        
        {receitas.length === 0 ? (
          <p>Nenhuma receita registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Data</th>
                  <th className="px-4 py-2 text-left">Órgão</th>
                  <th className="px-4 py-2 text-left">Serviço</th>
                  <th className="px-4 py-2 text-right">Qtd.</th>
                  <th className="px-4 py-2 text-right">Valor Unit.</th>
                  <th className="px-4 py-2 text-right">Valor Total</th>
                  <th className="px-4 py-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {receitas.map(receita => (
                  <tr key={receita.id} className="border-t border-gray-200">
                    <td className="px-4 py-2">{formatarData(receita.data_recebimento)}</td>
                    <td className="px-4 py-2">{receita.orgaos?.nome || 'N/A'}</td>
                    <td className="px-4 py-2">{receita.tipos_servicos?.nome || 'N/A'}</td>
                    <td className="px-4 py-2 text-right">{receita.quantidade}</td>
                    <td className="px-4 py-2 text-right">{formatarMoeda(receita.valor_unitario)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatarMoeda(receita.valor_total)}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleEdit(receita)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm mr-2"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td colSpan="5" className="px-4 py-2 text-right">Total:</td>
                  <td className="px-4 py-2 text-right">
                    {formatarMoeda(receitas.reduce((total, receita) => total + parseFloat(receita.valor_total), 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 