import { Button, Container, Title, Text, Stack, Select, Paper } from '@mantine/core';
import { useState } from 'react';
import { useAuth, UserRole } from './AuthContext';

export function LoginScreen() {
    const { login } = useAuth();
    const [role, setRole] = useState<string | null>(null);

    const handleLogin = () => {
        if (role) {
            login(role as UserRole);
        }
    };

    return (
        <Container size="xs" mt="xl">
            <Paper shadow="md" p="xl" radius="md" withBorder>
                <Stack gap="md" align="center">
                    <Title order={2}>FozDocs</Title>
                    <Text size="sm" c="dimmed">Ambiente de Desenvolvimento</Text>

                    <Select
                        label="Quem é você?"
                        placeholder="Selecione um papel"
                        data={[
                            { value: UserRole.ADMIN, label: '👨‍💻 Admin (Acesso Total)' },
                            { value: UserRole.PRODUCER, label: '🎥 Produtor (Gravar)' },
                            { value: UserRole.READER, label: '👀 Leitor (Apenas vê)' },
                        ]}
                        value={role}
                        onChange={setRole}
                        w="100%"
                    />

                    <Button fullWidth onClick={handleLogin} disabled={!role}>
                        Entrar
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
}
