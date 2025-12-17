import { useEffect, useState } from 'react';
import { Container, Select, Button, Stack, Title, Paper, Alert } from '@mantine/core';
import { useAuth } from '../auth/AuthContext';

// API Url - em dev
const API_URL = "http://localhost:8000/api/v1";

interface System {
    id: number;
    name: string;
    modules: Module[];
}

interface Module {
    id: number;
    name: string;
}

interface DashboardProps {
    onModuleSelect: (systemId: string, moduleId: string) => void;
}

export function Dashboard({ onModuleSelect }: DashboardProps) {
    const { user, logout } = useAuth();
    const [systems, setSystems] = useState<System[]>([]);
    const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        fetch(`${API_URL}/systems`)
            .then(res => {
                if (!res.ok) throw new Error("Erro ao conectar na API");
                return res.json();
            })
            .then(data => setSystems(data))
            .catch(err => setError("Falha ao carregar sistemas: " + err.message));
    }, []);

    const handleStart = () => {
        if (selectedSystem && selectedModule) {
            onModuleSelect(selectedSystem, selectedModule);
        }
    };

    const currentSystem = systems.find(s => s.id.toString() === selectedSystem);
    const modules = currentSystem?.modules.map(m => ({ value: m.id.toString(), label: m.name })) || [];
    const systemOptions = systems.map(s => ({ value: s.id.toString(), label: s.name }));

    return (
        <Container size="xs" mt="md">
            <Stack>
                <Paper withBorder p="md">
                    <Stack>
                        <Title order={4}>Novo Manual</Title>

                        {error && <Alert color="red">{error}</Alert>}

                        <Select
                            label="Sistema"
                            placeholder="Selecione..."
                            data={systemOptions}
                            value={selectedSystem}
                            onChange={setSelectedSystem}
                        />

                        <Select
                            label="Módulo"
                            placeholder="Selecione o Sistema primeiro"
                            data={modules}
                            value={selectedModule}
                            onChange={setSelectedModule}
                            disabled={!selectedSystem}
                        />

                        <Button
                            fullWidth
                            onClick={handleStart}
                            disabled={!selectedSystem || !selectedModule}
                        >
                            Preparar Gravação
                        </Button>

                        <Button variant="subtle" color="gray" size="xs" onClick={logout}>
                            Sair ({user?.email})
                        </Button>
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    );
}
