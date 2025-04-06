'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [status, setStatus] = useState('Verificando conexão...');
  const [isConnected, setIsConnected] = useState(null);

  useEffect(() => {
    async function checkConnection() {
      try {
        // A simple query to check if we can connect to Supabase
        const { data, error } = await supabase.from('dummy').select('*').limit(1).catch(() => ({
          error: { message: 'Não foi possível conectar ao Supabase' }
        }));
        
        if (error) {
          console.error('Erro na conexão:', error);
          setStatus(`Falha na conexão: ${error.message}`);
          setIsConnected(false);
        } else {
          setStatus('Conexão com Supabase estabelecida com sucesso!');
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Erro:', error);
        setStatus(`Erro ao conectar: ${error.message}`);
        setIsConnected(false);
      }
    }

    checkConnection();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Sistema de Controle da Receita</h1>
      
      <div className="p-4 border rounded shadow max-w-md w-full">
        <h2 className="text-xl mb-2">Status do Supabase</h2>
        
        <div className={`p-3 rounded ${
          isConnected === null ? 'bg-gray-100' : 
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {status}
        </div>
        
        {isConnected === false && (
          <div className="mt-4 text-sm">
            <p>Verifique se:</p>
            <ul className="list-disc pl-5 mt-1">
              <li>Suas variáveis de ambiente estão configuradas corretamente no arquivo .env.local</li>
              <li>O serviço do Supabase está ativo</li>
              <li>Você tem conectividade com a internet</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 