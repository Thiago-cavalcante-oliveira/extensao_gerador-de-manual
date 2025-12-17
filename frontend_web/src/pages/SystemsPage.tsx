import { useEffect, useState } from 'react';
import {
    Container, Title, Button, Group, Stack, TextInput, Table,
    ActionIcon, Modal, Card, Text, Badge, Textarea, Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconTrash, IconPlus, IconChevronRight, IconPencil, IconInfoCircle } from '@tabler/icons-react';
import type { System, Module } from '../types';
import { api } from '../services/api';

export function SystemsPage() {
    const [systems, setSystems] = useState<System[]>([]);

    // System Modal State
    const [openedSystem, { open: openSystem, close: closeSystem }] = useDisclosure(false);
    const [systemName, setSystemName] = useState("");
    const [systemContext, setSystemContext] = useState("");
    const [editingSystemId, setEditingSystemId] = useState<number | null>(null);

    // Module Modal State
    const [openedModule, { open: openModule, close: closeModule }] = useDisclosure(false);
    const [moduleName, setModuleName] = useState("");
    const [moduleContext, setModuleContext] = useState("");
    const [selectedSystemId, setSelectedSystemId] = useState<number | null>(null);
    const [editingModuleId, setEditingModuleId] = useState<number | null>(null);

    const fetchSystems = async () => {
        try {
            const data = await api.systems.list();
            setSystems(data);
        } catch (error) {
            console.error(error);
            alert("Erro ao carregar sistemas.");
        }
    };

    useEffect(() => {
        fetchSystems();
    }, []);

    // --- System Handlers ---

    const handleOpenCreateSystem = () => {
        setEditingSystemId(null);
        setSystemName("");
        setSystemContext("");
        openSystem();
    };

    const handleOpenEditSystem = (sys: System) => {
        setEditingSystemId(sys.id);
        setSystemName(sys.name);
        setSystemContext(sys.context_prompt || "");
        openSystem();
    };

    const handleSaveSystem = async () => {
        if (!systemName) return;

        try {
            if (editingSystemId) {
                await api.systems.update(editingSystemId, { name: systemName, context_prompt: systemContext });
            } else {
                await api.systems.create({ name: systemName, context_prompt: systemContext });
            }
            closeSystem();
            fetchSystems();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar sistema.");
        }
    };

    const handleDeleteSystem = async (id: number) => {
        if (!confirm("Tem certeza? Isso apagará todos os módulos e vídeos associados.")) return;
        try {
            await api.systems.delete(id);
            fetchSystems();
        } catch (error) {
            console.error(error);
            alert("Erro ao remover sistema.");
        }
    };

    // --- Module Handlers ---

    const handleOpenCreateModule = (sysId: number) => {
        setSelectedSystemId(sysId);
        setEditingModuleId(null);
        setModuleName("");
        setModuleContext("");
        openModule();
    };

    const handleOpenEditModule = (mod: Module, sysId: number) => {
        setSelectedSystemId(sysId);
        setEditingModuleId(mod.id);
        setModuleName(mod.name);
        setModuleContext(mod.context_prompt || "");
        openModule();
    };

    const handleSaveModule = async () => {
        if (!moduleName || !selectedSystemId) return;

        try {
            if (editingModuleId) {
                await api.modules.update(editingModuleId, { name: moduleName, context_prompt: moduleContext });
            } else {
                await api.modules.create(selectedSystemId, { name: moduleName, context_prompt: moduleContext });
            }
            closeModule();
            fetchSystems();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar módulo.");
        }
    };

    const handleDeleteModule = async (id: number) => {
        if (!confirm("Remover este módulo?")) return;
        try {
            await api.modules.delete(id);
            fetchSystems();
        } catch (error) {
            console.error(error);
            alert("Erro ao remover módulo.");
        }
    };

    return (
        <Container>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Sistemas & Módulos</Title>
                <Button leftSection={<IconPlus size={18} />} onClick={handleOpenCreateSystem}>
                    Novo Sistema
                </Button>
            </Group>

            <Stack gap="md">
                {systems.map((sys) => (
                    <Card key={sys.id} withBorder shadow="sm" radius="md">
                        <Group justify="space-between" mb="sm">
                            <Group>
                                <Text fw={700} size="lg">{sys.name}</Text>
                                <Badge color="blue" variant="light">{sys.modules.length} Módulos</Badge>
                                {sys.context_prompt && (
                                    <Tooltip label={sys.context_prompt} multiline w={300}>
                                        <IconInfoCircle size={18} color="gray" />
                                    </Tooltip>
                                )}
                            </Group>
                            <Group>
                                <Button size="xs" variant="light" onClick={() => handleOpenCreateModule(sys.id)}>
                                    + Módulo
                                </Button>
                                <ActionIcon variant="subtle" onClick={() => handleOpenEditSystem(sys)}>
                                    <IconPencil size={18} />
                                </ActionIcon>
                                <ActionIcon color="red" variant="subtle" onClick={() => handleDeleteSystem(sys.id)}>
                                    <IconTrash size={18} />
                                </ActionIcon>
                            </Group>
                        </Group>

                        {sys.modules.length > 0 ? (
                            <Table>
                                <Table.Tbody>
                                    {sys.modules.map((mod) => (
                                        <Table.Tr key={mod.id}>
                                            <Table.Td style={{ paddingLeft: 20 }}>
                                                <Group gap="xs">
                                                    <IconChevronRight size={14} color="gray" />
                                                    <Text>{mod.name}</Text>
                                                    {mod.context_prompt && (
                                                        <Tooltip label={mod.context_prompt} multiline w={300}>
                                                            <IconInfoCircle size={14} color="gray" />
                                                        </Tooltip>
                                                    )}
                                                </Group>
                                            </Table.Td>
                                            <Table.Td align="right">
                                                <Group gap="xs" justify="flex-end">
                                                    <ActionIcon size="sm" variant="subtle" onClick={() => handleOpenEditModule(mod, sys.id)}>
                                                        <IconPencil size={14} />
                                                    </ActionIcon>
                                                    <ActionIcon color="red" size="sm" variant="subtle" onClick={() => handleDeleteModule(mod.id)}>
                                                        <IconTrash size={14} />
                                                    </ActionIcon>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        ) : (
                            <Text c="dimmed" size="sm" fs="italic">Nenhum módulo cadastrado.</Text>
                        )}
                    </Card>
                ))}
            </Stack>

            {/* Modal System */}
            <Modal opened={openedSystem} onClose={closeSystem} title={editingSystemId ? "Editar Sistema" : "Novo Sistema"}>
                <Stack>
                    <TextInput
                        label="Nome do Sistema"
                        placeholder="Ex: Saúde, Tributário..."
                        value={systemName}
                        onChange={(e) => setSystemName(e.target.value)}
                        data-autofocus
                    />
                    <Textarea
                        label="Contexto para IA"
                        placeholder="Descreva o que este sistema faz. Ex: Sistema responsável pela gestão de pacientes..."
                        minRows={3}
                        value={systemContext}
                        onChange={(e) => setSystemContext(e.target.value)}
                    />
                    <Button onClick={handleSaveSystem}>{editingSystemId ? "Salvar" : "Criar"}</Button>
                </Stack>
            </Modal>

            {/* Modal Module */}
            <Modal opened={openedModule} onClose={closeModule} title={editingModuleId ? "Editar Módulo" : "Novo Módulo"}>
                <Stack>
                    <TextInput
                        label="Nome do Módulo"
                        placeholder="Ex: Triagem, Cadastro..."
                        value={moduleName}
                        onChange={(e) => setModuleName(e.target.value)}
                        data-autofocus
                    />
                    <Textarea
                        label="Contexto do Módulo"
                        placeholder="Detalhes específicos deste módulo."
                        minRows={3}
                        value={moduleContext}
                        onChange={(e) => setModuleContext(e.target.value)}
                    />
                    <Button onClick={handleSaveModule}>{editingModuleId ? "Salvar" : "Adicionar"}</Button>
                </Stack>
            </Modal>
        </Container>
    );
}
