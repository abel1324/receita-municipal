'use client';

import { useState, useEffect } from 'react';
import { relatoriosTable, orgaosTable, tiposServicosTable, receitasTable } from '../../../lib/database';

export default function RelatoriosPage() {
  const [orgaos, setOrgaos] = useState([]);
  const [tiposServicos, setTiposServicos] = useState([]);
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [filtros, setFiltros] = useState({
    titulo: '',
    descricao: '',
    orgao_id: '',
    tipo_servico_id: '',
    dataInicio: '',
    dataFim: ''
  });
  const [resultados, setResultados] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [relatoriosData, orgaosData, tiposServicosData] = await Promise.all([
        relatoriosTable.getAll(),
        orgaosTable.getAll({ apenasAtivos: true }),
        tiposServicosTable.getAll({ apenasAtivos: true })
      ]);
      
      setRelatorios(relatoriosData);
      setOrgaos(orgaosData);
      setTiposServicos(tiposServicosData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Não foi possível carregar os dados. Verifique se as tabelas foram criadas no Supabase.');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
  };

  const handleGerar = async (e) => {
    e.preventDefault();
    setGerando(true);
    setError(null);
    
    try {
      // Obter o ID do usuário logado (do localStorage)
      const usuarioString = localStorage.getItem('usuario');
      const usuario = usuarioString ? JSON.parse(usuarioString) : null;
      
      if (!usuario || !usuario.id) {
        setError('Usuário não autenticado. Faça login novamente.');
        return;
      }
      
      // Verificar datas
      if (!filtros.dataInicio || !filtros.dataFim) {
        setError('Período de datas é obrigatório para gerar relatório.');
        return;
      }
      
      // Buscar resultados
      const receitasData = await receitasTable.getAll({
        orgaoId: filtros.orgao_id || null,
        tipoServicoId: filtros.tipo_servico_id || null,
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim
      });
      
      // Obter totais
      const totais = await receitasTable.obterTotais({
        orgaoId: filtros.orgao_id || null,
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim
      });
      
      // Agrupar receitas por órgão para análise
      const receitasPorOrgao = receitasData.reduce((acc, receita) => {
        const orgaoId = receita.orgao_id;
        if (!acc[orgaoId]) {
          acc[orgaoId] = {
            nome: receita.orgaos?.nome,
            tipo: receita.orgaos?.tipo,
            valor_total: 0,
            quantidade: 0,
            receitas: []
          };
        }
        
        acc[orgaoId].valor_total += parseFloat(receita.valor_total);
        acc[orgaoId].quantidade += 1;
        acc[orgaoId].receitas.push(receita);
        
        return acc;
      }, {});
      
      // Criar o objeto de resultados
      const dataRelatorio = {
        receitas: receitasData,
        receitasPorOrgao,
        totais,
        periodo: {
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim
        }
      };
      
      // Salvar relatório
      const relatorio = await relatoriosTable.create({
        titulo: filtros.titulo || `Relatório de Receitas (${formatarData(new Date())})`,
        descricao: filtros.descricao || `Relatório de receitas no período de ${formatarDataSimples(filtros.dataInicio)} a ${formatarDataSimples(filtros.dataFim)}`,
        data_inicio: filtros.dataInicio,
        data_fim: filtros.dataFim,
        usuario_id: usuario.id,
        filtros: JSON.stringify({
          orgao_id: filtros.orgao_id,
          tipo_servico_id: filtros.tipo_servico_id
        }),
        resultados: JSON.stringify(dataRelatorio)
      });
      
      // Atualizar listas
      await loadData();
      
      // Exibir resultados
      setResultados(dataRelatorio);
      
      // Limpar formulário
      setFiltros({
        titulo: '',
        descricao: '',
        orgao_id: '',
        tipo_servico_id: '',
        dataInicio: '',
        dataFim: ''
      });
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      setError(`Erro ao gerar relatório: ${err.message}`);
    } finally {
      setGerando(false);
    }
  };

  const handleViewReport = async (id) => {
    try {
      setLoading(true);
      const relatorio = await relatoriosTable.getById(id);
      
      if (relatorio && relatorio.resultados) {
        try {
          const resultadosData = JSON.parse(relatorio.resultados);
          setResultados(resultadosData);
        } catch (parseError) {
          console.error('Erro ao analisar JSON de resultados:', parseError);
          setError('O relatório possui um formato inválido.');
        }
      } else {
        setError('Não foi possível carregar os resultados do relatório.');
      }
    } catch (err) {
      console.error('Erro ao visualizar relatório:', err);
      setError(`Erro ao visualizar relatório: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
    const data = new Date(dataISO);
    return data.toLocaleString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Formatação de data simples
  const formatarDataSimples = (dataISO) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading && !relatorios.length) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Relatórios</h1>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Relatórios</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Formulário de geração de relatório */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Gerar Novo Relatório</h2>
        
        <form onSubmit={handleGerar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="titulo">
              Título do Relatório
            </label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={filtros.titulo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Relatório de Receitas"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="descricao">
              Descrição
            </label>
            <input
              type="text"
              id="descricao"
              name="descricao"
              value={filtros.descricao}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrição do relatório"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="orgao_id">
              Órgão
            </label>
            <select
              id="orgao_id"
              name="orgao_id"
              value={filtros.orgao_id}
              onChange={handleChange}
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
            <label className="block text-gray-700 mb-2" htmlFor="tipo_servico_id">
              Tipo de Serviço
            </label>
            <select
              id="tipo_servico_id"
              name="tipo_servico_id"
              value={filtros.tipo_servico_id}
              onChange={handleChange}
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
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
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
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="col-span-1 md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              disabled={gerando}
            >
              {gerando ? 'Gerando...' : 'Gerar Relatório'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Lista de relatórios */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Relatórios Gerados</h2>
        
        {relatorios.length === 0 ? (
          <p>Nenhum relatório gerado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Título</th>
                  <th className="px-4 py-2 text-left">Período</th>
                  <th className="px-4 py-2 text-left">Data de Geração</th>
                  <th className="px-4 py-2 text-left">Gerado por</th>
                  <th className="px-4 py-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {relatorios.map(relatorio => (
                  <tr key={relatorio.id} className="border-t border-gray-200">
                    <td className="px-4 py-2">{relatorio.titulo}</td>
                    <td className="px-4 py-2">
                      {formatarDataSimples(relatorio.data_inicio)} a {formatarDataSimples(relatorio.data_fim)}
                    </td>
                    <td className="px-4 py-2">{formatarData(relatorio.data_geracao)}</td>
                    <td className="px-4 py-2">{relatorio.usuario?.nome || 'N/A'}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleViewReport(relatorio.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        Visualizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Resultados do relatório */}
      {resultados && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Resultados do Relatório</h2>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Resumo</h3>
              <div className="text-sm text-gray-500">
                Período: {formatarDataSimples(resultados.periodo.dataInicio)} a {formatarDataSimples(resultados.periodo.dataFim)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-gray-500 text-sm">Total de Transações</div>
                <div className="text-2xl font-bold">{resultados.totais.quantidade}</div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-gray-500 text-sm">Valor Total</div>
                <div className="text-2xl font-bold text-blue-700">{formatarMoeda(resultados.totais.valorTotal)}</div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Receitas por Órgão</h3>
            
            {Object.keys(resultados.receitasPorOrgao).length === 0 ? (
              <p>Nenhum dado encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Órgão</th>
                      <th className="px-4 py-2 text-left">Tipo</th>
                      <th className="px-4 py-2 text-right">Transações</th>
                      <th className="px-4 py-2 text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(resultados.receitasPorOrgao).map(([id, orgao]) => (
                      <tr key={id} className="border-t border-gray-200">
                        <td className="px-4 py-2">{orgao.nome}</td>
                        <td className="px-4 py-2">{orgao.tipo}</td>
                        <td className="px-4 py-2 text-right">{orgao.quantidade}</td>
                        <td className="px-4 py-2 text-right font-semibold">{formatarMoeda(orgao.valor_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Todas as Transações</h3>
            
            {resultados.receitas.length === 0 ? (
              <p>Nenhuma transação encontrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Data</th>
                      <th className="px-4 py-2 text-left">Órgão</th>
                      <th className="px-4 py-2 text-left">Serviço</th>
                      <th className="px-4 py-2 text-right">Qtd.</th>
                      <th className="px-4 py-2 text-right">Valor Total</th>
                      <th className="px-4 py-2 text-left">Referência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.receitas.map(receita => (
                      <tr key={receita.id} className="border-t border-gray-200">
                        <td className="px-4 py-2">{formatarData(receita.data_recebimento)}</td>
                        <td className="px-4 py-2">{receita.orgaos?.nome || 'N/A'}</td>
                        <td className="px-4 py-2">{receita.tipos_servicos?.nome || 'N/A'}</td>
                        <td className="px-4 py-2 text-right">{receita.quantidade}</td>
                        <td className="px-4 py-2 text-right font-semibold">{formatarMoeda(receita.valor_total)}</td>
                        <td className="px-4 py-2">{receita.referencia || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan="4" className="px-4 py-2 text-right">Total:</td>
                      <td className="px-4 py-2 text-right">
                        {formatarMoeda(resultados.receitas.reduce((total, receita) => total + parseFloat(receita.valor_total), 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 