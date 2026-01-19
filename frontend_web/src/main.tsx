import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css';
import './index.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import App from './App.tsx'
import { ConfigurationProvider, useConfiguration } from './contexts/ConfigurationContext.tsx';

// Componente intermediário para aplicar o tema dinâmico
function ThemedApp() {
  const { config, loading } = useConfiguration();

  // Cria o tema Mantine dinamicamente
  const theme = createTheme({
    primaryColor: 'brand',
    colors: {
      // Mantine precisa de 10 shades. Vamos gerar um hack simples ou usar a cor primária como base.
      // Hack: Repetir a cor primária para todas as shades temporariamente ou usar um gerador de paleta real.
      // Para simplificar: Vamos definir 'brand' usando a cor configurada.
      brand: [
        '#f0f9ff', // 0
        '#e0f2fe', // 1
        '#bae6fd', // 2
        '#7dd3fc', // 3
        '#38bdf8', // 4
        config.primary_color, // 5 (Primary default)
        '#0284c7', // 6
        '#0369a1', // 7
        '#075985', // 8
        '#0c4a6e', // 9
      ],
      secondary: [
        '#f0fdf4',
        '#dcfce7',
        '#bbf7d0',
        '#86efac',
        '#4ade80',
        config.secondary_color,
        '#16a34a',
        '#15803d',
        '#166534',
        '#14532d',
      ]
    },
    // Outras customizações globais aqui
  });

  if (loading) return <div>Carregando configurações...</div>;

  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <App />
    </MantineProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigurationProvider>
      <ThemedApp />
    </ConfigurationProvider>
  </StrictMode>,
)
