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