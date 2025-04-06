export const metadata = {
  title: 'Sistema de Controle da Receita',
  description: 'Sistema para controle da receita integrado com Supabase',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
} 