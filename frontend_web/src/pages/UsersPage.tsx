import { useEffect, useState } from 'react';
import {
    Title, Container, Button, Group, Table, Badge, ActionIcon,
    Modal, TextInput, Select, Switch, Stack, Text
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus, Trash2, Edit } from 'lucide-react';
// import { api } from '../services/api'; // Precisamos adicionar users ao api service depois

// Interface para Usuario (Temporaria ate termos a do backend importada)
interface User {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
}

export function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [opened, { open, close }] = useDisclosure(false);

    // Form State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('reader');
    const [isActive, setIsActive] = useState(true);

    // Mock Fetch
    const fetchUsers = async () => {
        try {
            // Em breve: const data = await api.users.list();
            // Mock data for now
            setUsers([
                { id: 1, email: 'joao@foz.pr.gov.br', role: 'admin', is_active: true },
                { id: 2, email: 'maria@foz.pr.gov.br', role: 'producer', is_active: true },
                { id: 3, email: 'roberto@saude.gov.br', role: 'reader', is_active: false },
            ]);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleEdit = (user: User) => {
        setEditingId(user.id);
        setEmail(user.email);
        setRole(user.role);
        setIsActive(user.is_active);
        open();
    };

    const handleCreate = () => {
        setEditingId(null);
        setEmail('');
        setRole('reader');
        setIsActive(true);
        open();
    };

    const handleSave = async () => {
        // Implementar chamada API real
        alert("Salvar (Simulação): " + email);
        close();
        fetchUsers();
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <Badge color="violet">Admin</Badge>;
            case 'producer': return <Badge color="teal">Produtor</Badge>;
            default: return <Badge color="gray">Leitor</Badge>;
        }
    };

    return (
        <Container fluid>
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2}>Usuários</Title>
                    <Text c="dimmed" size="sm">Gerencie o acesso ao FozDocs</Text>
                </div>
                <Button leftSection={<Plus size={18} />} onClick={handleCreate}>Novo Usuário</Button>
            </Group>

            <Table verticalSpacing="sm" withTableBorder>
                <Table.Thead bg="gray.0">
                    <Table.Tr>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Permissão</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th style={{ textAlign: 'right' }}>Ações</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {users.map((user) => (
                        <Table.Tr key={user.id}>
                            <Table.Td fw={500}>{user.email}</Table.Td>
                            <Table.Td>{getRoleBadge(user.role)}</Table.Td>
                            <Table.Td>
                                {user.is_active ?
                                    <Badge variant="dot" color="green">Ativo</Badge> :
                                    <Badge variant="dot" color="red">Inativo</Badge>
                                }
                            </Table.Td>
                            <Table.Td align="right">
                                <Group gap="xs" justify="flex-end">
                                    <ActionIcon variant="subtle" color="blue" onClick={() => handleEdit(user)}>
                                        <Edit size={16} />
                                    </ActionIcon>
                                    <ActionIcon variant="subtle" color="red">
                                        <Trash2 size={16} />
                                    </ActionIcon>
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>

            <Modal opened={opened} onClose={close} title={editingId ? "Editar Usuário" : "Novo Usuário"}>
                <Stack>
                    <TextInput
                        label="Email"
                        placeholder="usuario@foz.pr.gov.br"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                    <Select
                        label="Perfil"
                        value={role}
                        onChange={(v) => setRole(v || 'reader')}
                        data={[
                            { value: 'admin', label: 'Administrador (Total)' },
                            { value: 'producer', label: 'Produtor (Cria Manuais)' },
                            { value: 'reader', label: 'Leitor (Apenas Visualiza)' },
                        ]}
                    />
                    <Switch
                        label="Usuário Ativo"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.currentTarget.checked)}
                    />
                    <Button fullWidth mt="md" onClick={handleSave}>Salvar</Button>
                </Stack>
            </Modal>
        </Container>
    );
}
