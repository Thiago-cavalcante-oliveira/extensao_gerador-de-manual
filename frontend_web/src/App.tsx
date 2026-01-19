import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './theme';
import { AdminShell } from './components/Layout/AdminShell';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { VideosPage } from './pages/VideosPage';
import { SystemsPage } from './pages/SystemsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditPage } from './pages/AuditPage';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { EditorPage } from './pages/EditorPage';
import { PlayerPage } from './pages/PlayerPage';
import { ViewerPage } from './pages/ViewerPage';

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <AdminShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/library" element={<ViewerPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/systems" element={<SystemsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/design" element={<DesignSystemPage />} />
            <Route path="/editor/:id" element={<EditorPage />} />
            <Route path="/player/:id" element={<PlayerPage />} />
          </Routes>
        </AdminShell>
      </BrowserRouter>
    </MantineProvider>
  );
}
