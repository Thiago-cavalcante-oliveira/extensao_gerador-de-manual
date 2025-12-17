import '@mantine/core/styles.css';
import { MantineProvider, AppShell, Group, Title, NavLink, Text, Divider } from '@mantine/core';
import { IconVideo, IconApps, IconPalette } from '@tabler/icons-react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { SystemsPage } from './pages/SystemsPage';
import { VideosPage } from './pages/VideosPage';
import { EditorPage } from './pages/EditorPage';
import { PlayerPage } from './pages/PlayerPage';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { theme } from './theme';

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <AppShell
          padding="md"
          header={{ height: 60 }}
          navbar={{ width: 250, breakpoint: 'sm' }}
        >
          <AppShell.Header>
            <Group h="100%" px="md">
              <Title order={3}>FozDocs Curadoria</Title>
            </Group>
          </AppShell.Header>

          <AppShell.Navbar p="md">
            <NavLink
              label="Vídeos / Capítulos"
              component={Link}
              to="/"
              leftSection={<IconVideo size={20} />}
            />
            <NavLink
              label="Sistemas e Módulos"
              component={Link}
              to="/systems"
              leftSection={<IconApps size={20} />}
            />

            <Divider my="sm" label={<Text size="xs" c="dimmed">Ferramentas</Text>} labelPosition="left" />
            <NavLink
              label="Design System"
              component={Link}
              to="/design"
              leftSection={<IconPalette size={20} />}
              variant="subtle"
              color="gray"
            />
          </AppShell.Navbar>

          <AppShell.Main>
            <Routes>
              <Route path="/" element={<VideosPage />} />
              <Route path="/systems" element={<SystemsPage />} />
              <Route path="/editor/:id" element={<EditorPage />} />
              <Route path="/player/:id" element={<PlayerPage />} />
              <Route path="/design" element={<DesignSystemPage />} />
            </Routes>
          </AppShell.Main>
        </AppShell>
      </BrowserRouter>
    </MantineProvider>
  );
}
