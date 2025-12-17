import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Title, Table, Badge, ActionIcon, Group, Text, Card,
    Button, Tooltip
} from '@mantine/core';
import { IconTrash, IconPlayerPlay, IconRefresh, IconPencil } from '@tabler/icons-react';
import type { Chapter } from '../types';
import { api } from '../services/api';

export function VideosPage() {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchChapters = async () => {
        setLoading(true);
        try {
            const data = await api.chapters.list();
            setChapters(data);
        } catch (error) {
            console.error(error);
            alert("Erro ao carregar vídeos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChapters();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja apagar este vídeo?")) return;
        try {
            await api.chapters.delete(id);
            fetchChapters();
        } catch (error) {
            console.error(error);
            alert("Erro ao remover vídeo.");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge color="yellow">Processando AI</Badge>;
            case "DRAFT":
                return <Badge color="blue">Rascunho</Badge>;
            case "PUBLISHED":
                return <Badge color="green">Publicado</Badge>;
            default:
                return <Badge color="gray">{status}</Badge>;
        }
    };

    return (
        <Container>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Vídeos Gravados</Title>
                <Button variant="light" leftSection={<IconRefresh size={18} />} onClick={fetchChapters} loading={loading}>
                    Atualizar
                </Button>
            </Group>

            <Card withBorder shadow="sm" radius="md">
                {chapters.length > 0 ? (
                    <Table highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>ID</Table.Th>
                                <Table.Th>Sistema / Módulo</Table.Th>
                                <Table.Th>Título</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {chapters.map((chap) => (
                                <Table.Tr key={chap.id}>
                                    <Table.Td>{chap.id}</Table.Td>
                                    <Table.Td>
                                        <Text size="sm" fw={500}>{chap.system_name || "-"}</Text>
                                        <Text size="xs" c="dimmed">{chap.module_name || "-"}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" lineClamp={1} w={300}>{chap.title}</Text>
                                        <Text size="xs" c="dimmed">{new Date(chap.created_at).toLocaleString()}</Text>
                                    </Table.Td>
                                    <Table.Td>{getStatusBadge(chap.status)}</Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            {chap.video_url && (
                                                <Tooltip label="Ver Vídeo">
                                                    <ActionIcon component="a" href={chap.video_url} target="_blank" variant="light" color="blue">
                                                        <IconPlayerPlay size={18} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            )}
                                            <Tooltip label="Editar Manual">
                                                <ActionIcon variant="light" color="orange" onClick={() => navigate(`/editor/${chap.id}`)}>
                                                    <IconPencil size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <ActionIcon color="red" variant="subtle" onClick={() => handleDelete(chap.id)}>
                                                <IconTrash size={18} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Text ta="center" py="xl" c="dimmed">
                        Nenhum vídeo gravado ainda. Use a extensão para gravar!
                    </Text>
                )}
            </Card>
        </Container>
    );
}
