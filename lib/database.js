import { supabase } from './supabase';
import crypto from 'crypto';

/**
 * Criptografa uma senha usando SHA-256
 * @param {string} password Senha a ser criptografada
 * @returns {string} Senha criptografada
 */
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Utilitário para trabalhar com a tabela de órgãos
 */
export const orgaosTable = {
  /**
   * Busca todos os órgãos
   * @param {Object} options Opções de filtro
   * @returns {Promise<Array>} Lista de órgãos
   */
  getAll: async (options = {}) => {
    const { apenasAtivos = true, tipo = null } = options;
    
    let query = supabase.from('orgaos').select('*');
    
    if (apenasAtivos) {
      query = query.eq('ativo', true);
    }
    
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar órgãos:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Busca um órgão pelo ID
   * @param {string} id ID do órgão
   * @returns {Promise<Object>} Dados do órgão
   */
  getById: async (id) => {
    const { data, error } = await supabase
      .from('orgaos')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Erro ao buscar órgão por ID:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Cria um novo órgão
   * @param {Object} orgao Dados do órgão
   * @returns {Promise<Object>} Órgão criado
   */
  create: async (orgao) => {
    const { data, error } = await supabase
      .from('orgaos')
      .insert([orgao])
      .select();
      
    if (error) {
      console.error('Erro ao criar órgão:', error);
      throw error;
    }
    
    return data[0];
  },
  
  /**
   * Atualiza um órgão
   * @param {string} id ID do órgão
   * @param {Object} updates Dados a serem atualizados
   * @returns {Promise<Object>} Órgão atualizado
   */
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('orgaos')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('Erro ao atualizar órgão:', error);
      throw error;
    }
    
    return data[0];
  }
};

/**
 * Utilitário para trabalhar com a tabela de usuários
 */
export const usuariosTable = {
  /**
   * Busca todos os usuários
   * @param {Object} options Opções de filtro
   * @returns {Promise<Array>} Lista de usuários
   */
  getAll: async (options = {}) => {
    const { apenasAtivos = true, nivelAcesso = null, orgaoId = null } = options;
    
    let query = supabase.from('usuarios').select('*, orgaos(*)');
    
    if (apenasAtivos) {
      query = query.eq('ativo', true);
    }
    
    if (nivelAcesso) {
      query = query.eq('nivel_acesso', nivelAcesso);
    }
    
    if (orgaoId) {
      query = query.eq('orgao_id', orgaoId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Busca um usuário pelo ID
   * @param {string} id ID do usuário
   * @returns {Promise<Object>} Dados do usuário
   */
  getById: async (id) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, orgaos(*)')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Cria um novo usuário
   * @param {Object} usuario Dados do usuário
   * @returns {Promise<Object>} Usuário criado
   */
  create: async (usuario) => {
    // Criptografa a senha antes de armazenar
    const usuarioComSenhaHash = {
      ...usuario,
      senha_hash: hashPassword(usuario.senha_hash)
    };
    
    const { data, error } = await supabase
      .from('usuarios')
      .insert([usuarioComSenhaHash])
      .select();
      
    if (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
    
    return data[0];
  },
  
  /**
   * Atualiza um usuário
   * @param {string} id ID do usuário
   * @param {Object} updates Dados a serem atualizados
   * @returns {Promise<Object>} Usuário atualizado
   */
  update: async (id, updates) => {
    // Se a senha foi fornecida, criptografa antes de armazenar
    const updatesComSenhaHash = { ...updates };
    if (updatesComSenhaHash.senha_hash) {
      updatesComSenhaHash.senha_hash = hashPassword(updatesComSenhaHash.senha_hash);
    }
    
    const { data, error } = await supabase
      .from('usuarios')
      .update(updatesComSenhaHash)
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
    
    return data[0];
  },
  
  /**
   * Autentica um usuário por email e senha
   * @param {string} email Email do usuário
   * @param {string} senha Senha do usuário
   * @returns {Promise<Object>} Dados do usuário autenticado
   */
  autenticar: async (email, senha) => {
    const senhaHash = hashPassword(senha);
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, orgaos(*)')
      .eq('email', email)
      .eq('senha_hash', senhaHash)
      .eq('ativo', true)
      .single();
      
    if (error) {
      console.error('Erro na autenticação:', error);
      throw new Error('Email ou senha incorretos');
    }
    
    // Atualiza o último acesso
    await supabase
      .from('usuarios')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', data.id);
    
    return data;
  }
};

/**
 * Utilitário para trabalhar com a tabela de tipos de serviços
 */
export const tiposServicosTable = {
  /**
   * Busca todos os tipos de serviços
   * @param {Object} options Opções de filtro
   * @returns {Promise<Array>} Lista de tipos de serviços
   */
  getAll: async (options = {}) => {
    const { apenasAtivos = true, categoria = null } = options;
    
    let query = supabase.from('tipos_servicos').select('*');
    
    if (apenasAtivos) {
      query = query.eq('ativo', true);
    }
    
    if (categoria) {
      query = query.eq('categoria', categoria);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar tipos de serviços:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Busca um tipo de serviço pelo ID
   * @param {string} id ID do tipo de serviço
   * @returns {Promise<Object>} Dados do tipo de serviço
   */
  getById: async (id) => {
    const { data, error } = await supabase
      .from('tipos_servicos')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Erro ao buscar tipo de serviço por ID:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Cria um novo tipo de serviço
   * @param {Object} tipoServico Dados do tipo de serviço
   * @returns {Promise<Object>} Tipo de serviço criado
   */
  create: async (tipoServico) => {
    const { data, error } = await supabase
      .from('tipos_servicos')
      .insert([tipoServico])
      .select();
      
    if (error) {
      console.error('Erro ao criar tipo de serviço:', error);
      throw error;
    }
    
    return data[0];
  },
  
  /**
   * Atualiza um tipo de serviço
   * @param {string} id ID do tipo de serviço
   * @param {Object} updates Dados a serem atualizados
   * @returns {Promise<Object>} Tipo de serviço atualizado
   */
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('tipos_servicos')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('Erro ao atualizar tipo de serviço:', error);
      throw error;
    }
    
    return data[0];
  }
};

/**
 * Utilitário para trabalhar com a tabela de receitas
 */
export const receitasTable = {
  /**
   * Busca todas as receitas
   * @param {Object} options Opções de filtro
   * @returns {Promise<Array>} Lista de receitas
   */
  getAll: async (options = {}) => {
    const { 
      orgaoId = null, 
      tipoServicoId = null, 
      dataInicio = null, 
      dataFim = null,
      usuarioId = null
    } = options;
    
    let query = supabase.from('receitas').select(`
      *,
      orgaos(*),
      tipos_servicos(*),
      usuario_registro:usuarios(id, nome, email)
    `);
    
    if (orgaoId) {
      query = query.eq('orgao_id', orgaoId);
    }
    
    if (tipoServicoId) {
      query = query.eq('tipo_servico_id', tipoServicoId);
    }
    
    if (usuarioId) {
      query = query.eq('usuario_registro_id', usuarioId);
    }
    
    if (dataInicio) {
      query = query.gte('data_recebimento', dataInicio);
    }
    
    if (dataFim) {
      query = query.lte('data_recebimento', dataFim);
    }
    
    // Ordenar por data de recebimento decrescente (mais recente primeiro)
    query = query.order('data_recebimento', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar receitas:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Busca uma receita pelo ID
   * @param {string} id ID da receita
   * @returns {Promise<Object>} Dados da receita
   */
  getById: async (id) => {
    const { data, error } = await supabase
      .from('receitas')
      .select(`
        *,
        orgaos(*),
        tipos_servicos(*),
        usuario_registro:usuarios(id, nome, email)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Erro ao buscar receita por ID:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Cria uma nova receita
   * @param {Object} receita Dados da receita
   * @returns {Promise<Object>} Receita criada
   */
  create: async (receita) => {
    // Calcula o valor total se não for fornecido
    const receitaCompleta = { ...receita };
    if (!receitaCompleta.valor_total && receitaCompleta.quantidade && receitaCompleta.valor_unitario) {
      receitaCompleta.valor_total = receitaCompleta.quantidade * receitaCompleta.valor_unitario;
    }
    
    const { data, error } = await supabase
      .from('receitas')
      .insert([receitaCompleta])
      .select();
      
    if (error) {
      console.error('Erro ao criar receita:', error);
      throw error;
    }
    
    return data[0];
  },
  
  /**
   * Atualiza uma receita
   * @param {string} id ID da receita
   * @param {Object} updates Dados a serem atualizados
   * @returns {Promise<Object>} Receita atualizada
   */
  update: async (id, updates) => {
    // Recalcula o valor total se quantidade ou valor unitário forem alterados
    const updatesCompletos = { ...updates };
    if (
      (updatesCompletos.quantidade !== undefined || updatesCompletos.valor_unitario !== undefined) && 
      !updatesCompletos.valor_total
    ) {
      // Primeiro obter os dados atuais para fazer o cálculo
      const { data: receitaAtual } = await supabase
        .from('receitas')
        .select('quantidade, valor_unitario')
        .eq('id', id)
        .single();
      
      const quantidade = updatesCompletos.quantidade !== undefined ? 
        updatesCompletos.quantidade : receitaAtual.quantidade;
      
      const valorUnitario = updatesCompletos.valor_unitario !== undefined ? 
        updatesCompletos.valor_unitario : receitaAtual.valor_unitario;
      
      updatesCompletos.valor_total = quantidade * valorUnitario;
    }
    
    const { data, error } = await supabase
      .from('receitas')
      .update(updatesCompletos)
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('Erro ao atualizar receita:', error);
      throw error;
    }
    
    return data[0];
  },
  
  /**
   * Obter total de receitas por período e órgão
   * @param {Object} options Opções de filtro
   * @returns {Promise<Object>} Totais de receitas
   */
  obterTotais: async ({ orgaoId = null, tipoServicoId = null, dataInicio = null, dataFim = null }) => {
    try {
      let query = supabase
        .from('receitas')
        .select(`
          valor_total
        `);
      
      if (orgaoId) {
        query = query.eq('orgao_id', orgaoId);
      }
      
      if (tipoServicoId) {
        query = query.eq('tipo_servico_id', tipoServicoId);
      }
      
      if (dataInicio) {
        query = query.gte('data_recebimento', dataInicio);
      }
      
      if (dataFim) {
        query = query.lte('data_recebimento', dataFim);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Calcular totais
      const valorTotal = data.reduce((acc, receita) => acc + parseFloat(receita.valor_total), 0);
      const quantidade = data.length;
      
      return {
        valorTotal,
        quantidade
      };
    } catch (error) {
      console.error('Erro ao obter totais de receitas:', error);
      throw error;
    }
  }
};

/**
 * Utilitário para trabalhar com a tabela de relatórios
 */
export const relatoriosTable = {
  /**
   * Busca todos os relatórios
   * @param {Object} options Opções de filtro
   * @returns {Promise<Array>} Lista de relatórios
   */
  getAll: async (options = {}) => {
    const { usuarioId = null } = options;
    
    let query = supabase.from('relatorios').select(`
      *,
      usuario:usuarios(id, nome, email)
    `).order('data_geracao', { ascending: false });
    
    if (usuarioId) {
      query = query.eq('usuario_id', usuarioId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar relatórios:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Busca um relatório pelo ID
   * @param {string} id ID do relatório
   * @returns {Promise<Object>} Dados do relatório
   */
  getById: async (id) => {
    const { data, error } = await supabase
      .from('relatorios')
      .select(`
        *,
        usuario:usuarios(id, nome, email)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Erro ao buscar relatório por ID:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Cria um novo relatório
   * @param {Object} relatorio Dados do relatório
   * @returns {Promise<Object>} Relatório criado
   */
  create: async (relatorio) => {
    const { data, error } = await supabase
      .from('relatorios')
      .insert([relatorio])
      .select();
      
    if (error) {
      console.error('Erro ao criar relatório:', error);
      throw error;
    }
    
    return data[0];
  }
}; 