import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Title, Button, Group, Stack, TextInput,
    Textarea, Card, Badge, Loader, Text, ActionIcon
} from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy, IconRefresh, IconEye } from '@tabler/icons-react';
import { api } from '../services/api';
import type { Chapter } from '../types';
import { Timeline } from '../components/Timeline';

interface Step {
    timestamp: string;
    description: string;
    audio_url?: string;
    duration?: number;
}

interface ManualContent {
    title: string;
    steps: Step[];
}

export function EditorPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // ...

    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [content, setContent] = useState<ManualContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeStep, setActiveStep] = useState<number>(-1);
    const [videoDuration, setVideoDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const vidRef = useRef<HTMLVideoElement>(null);
    const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

    useEffect(() => {
        if (!id) return;
        fetchChapter();
    }, [id]);

    useEffect(() => {
        if (content && content.steps) {
            audioRefs.current = audioRefs.current.slice(0, content.steps.length);
        }
    }, [content]);

    const fetchChapter = async () => {
        try {
            // @ts-ignore
            const data = await api.chapters.get(Number(id));
            setChapter(data);

            // POLLING LOGIC
            // POLLING LOGIC
            if (data.status === 'PENDING') {
                // Optimize: Only update state if not already in pending state (empty steps)
                // This prevents the video/page from "reloading" or flickering every 3 seconds
                if (!content || (content.steps && content.steps.length > 0)) {
                    setContent({ title: data.title, steps: [] });
                }
                setTimeout(fetchChapter, 3000); // Retry in 3s
                return;
            }

            if (data.content) {
                if (typeof data.content === 'string') {
                    try {
                        setContent(JSON.parse(data.content));
                    } catch {
                        setContent({ title: data.title, steps: [] });
                    }
                } else {
                    setContent(data.content as ManualContent);
                }
            } else {
                setContent({ title: data.title, steps: [] });
            }
        } catch (error) {
            console.error(error);
            // Don't alert on poll error to avoid spam, maybe just log
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!content || !chapter) return;
        setSaving(true);
        try {
            await api.chapters.update(chapter.id, {
                title: content.title,
                content: content
            });
            // Show feedback (could be a toast, but using simple visual feedback for now)
            alert("Salvo com sucesso!");
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar.");
        } finally {
            setSaving(false);
        }
    };

    const updateStep = (index: number, field: keyof Step, value: string) => {
        if (!content) return;
        const newSteps = [...content.steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setContent({ ...content, steps: newSteps });
    };

    const handleRegenerateAudio = async (index: number) => {
        if (!content || !chapter) return;

        try {
            // Indicar loading no botão (usando state local ou apenas global loading se preferir, 
            // mas local é melhor UI. Para simplicidade, vamos de loading global rápido ou alert)
            // Ideal seria ter um loading por passo, mas vamos usar um toast/alert simples por enquanto
            const step = content.steps[index];
            const result = await api.chapters.regenerateAudio(chapter.id, index, step.description);

            // Atualizar audio_url do passo
            const newSteps = [...content.steps];
            newSteps[index] = { ...newSteps[index], audio_url: result.audio_url };
            setContent({ ...content, steps: newSteps });

            // Force reload audio element
            if (audioRefs.current[index]) {
                audioRefs.current[index]!.load();
            }

        } catch (error) {
            console.error(error);
            alert("Erro ao regenerar áudio.");
        }
    };

    const parseTimestamp = (timeStr: string) => {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
    };

    const handleTimeUpdate = () => {
        if (!vidRef.current || !content) return;
        const currentTime = vidRef.current.currentTime;
        setCurrentTime(currentTime);

        // Find current step
        // We look for the last step that has timestamp <= currentTime
        let currentIdx = -1;
        for (let i = 0; i < content.steps.length; i++) {
            const time = parseTimestamp(content.steps[i].timestamp);
            if (time <= currentTime + 0.5) { // 0.5s tolerance
                currentIdx = i;
            } else {
                break;
            }
        }

        if (currentIdx !== activeStep) {
            setActiveStep(currentIdx);
            // Auto-play audio if we just entered this step and it's not the initial load
            if (currentIdx !== -1 && audioRefs.current[currentIdx]) {
                // Prepare: pause all others?
                audioRefs.current.forEach(a => a && !a.paused && a.pause());

                // Play current
                const audio = audioRefs.current[currentIdx];
                if (audio) {
                    audio.currentTime = 0;
                    audio.play().catch(e => console.log("Auto-play prevented", e));
                }
            }
        }
    };

    const handleStepMove = (index: number, newStartTime: number) => {
        if (!content) return;

        // Convert seconds to MM:SS format
        const min = Math.floor(newStartTime / 60);
        const sec = Math.floor(newStartTime % 60);
        const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;

        const newSteps = [...content.steps];
        newSteps[index] = { ...newSteps[index], timestamp: timeStr };

        // Sort steps by timestamp to keep order? 
        // For now let's just update the timestamp. Sorting might be disruptive while dragging.
        // Actually, if we change timestamp, user might expect it to jump in the list.
        // Let's keep it simple for MVP: just update text.

        setContent({ ...content, steps: newSteps });
    };

    const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

    const handleStepDoubleClick = (index: number) => {
        setEditingStepIndex(index);
        // Pause video to focus on editing
        if (vidRef.current) vidRef.current.pause();
    };

    const handleDeleteStep = (index: number) => {
        if (!content) return;
        if (confirm("Tem certeza que deseja excluir este passo? O áudio será removido.")) {
            const newSteps = [...content.steps];
            newSteps.splice(index, 1);
            setContent({ ...content, steps: newSteps });
            setEditingStepIndex(null); // Close modal
        }
    };

    const handleModalClose = () => {
        setEditingStepIndex(null);
    };

    if (loading) return <Container py="xl"><Loader /></Container>;
    if (!chapter || !content) return <Container py="xl"><Text>Não encontrado.</Text></Container>;


    return (
        <Container fluid p="md" style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa' }}>
            {/* Header */}
            <Group mb="md" justify="space-between">
                <Group>
                    <Button
                        variant="default"
                        leftSection={<IconArrowLeft size={18} />}
                        onClick={() => navigate('/')}
                    >
                        Voltar
                    </Button>
                    <Title order={4} ml="xs">Editor</Title>
                    <TextInput
                        placeholder="Título do Manual"
                        value={content.title}
                        onChange={(e) => setContent({ ...content, title: e.target.value })}
                        size="xs"
                        style={{ width: 300 }}
                    />
                    <Badge color={chapter.status === 'PUBLISHED' ? 'green' : 'blue'}>{chapter.status}</Badge>
                </Group>
                <Group>
                    <Button
                        variant="subtle"
                        leftSection={<IconEye size={18} />}
                        onClick={() => navigate(`/player/${id}`)}
                    >
                        Visualizar
                    </Button>
                    <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave} loading={saving}>
                        Salvar
                    </Button>
                </Group>
            </Group>

            {/* Main Content Area (Video Only - Centered) */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', backgroundColor: '#000', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                <video
                    ref={vidRef}
                    src={chapter.video_url}
                    controls
                    style={{ maxHeight: '100%', maxWidth: '100%' }}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                    onCanPlay={(e) => {
                        if (e.currentTarget.duration) setVideoDuration(e.currentTarget.duration);
                    }}
                />
            </div>

            {/* Bottom Row: Timeline (Full Width) */}
            <Card withBorder radius="md" padding="xs" bg="#1A1B1E" style={{ flexShrink: 0 }}>
                <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">Timeline Studio (Clique Duplo no bloco azul para editar)</Text>
                </Group>



                {/* Processing State Display */}
                {chapter.status === 'PENDING' && (
                    <div className="bg-blue-900/20 border border-blue-500/50 p-6 rounded mb-4 animate-pulse">
                        <Stack align="center" gap="md">
                            <Loader color="blue" type="bars" />
                            <div className="text-center">
                                <Text c="blue" fw={700} size="lg">Processando IA...</Text>
                                <Text c="dimmed" size="sm">A inteligência artificial está analisando o vídeo e criando o passo-a-passo.</Text>
                                <Text c="dimmed" size="xs">Isso pode levar alguns segundos.</Text>
                            </div>
                            <Button
                                color="red"
                                variant="subtle"
                                size="xs"
                                onClick={async () => {
                                    if (confirm("Deseja cancelar o processamento atual?")) {
                                        try {
                                            // @ts-ignore
                                            await api.chapters.cancel(chapter.id);
                                            setChapter({ ...chapter, status: 'FAILED', content: '{"error": "Cancelado"}' });
                                        } catch (e) {
                                            alert("Erro ao cancelar.");
                                        }
                                    }
                                }}
                            >
                                Cancelar / Parar
                            </Button>
                        </Stack>
                    </div>
                )}

                {/* Error State Display */}
                {/* @ts-ignore */}
                {content.error && chapter.status === 'FAILED' && (
                    <div className="bg-red-900/20 border border-red-500/50 p-4 rounded mb-4">
                        <Stack gap="xs">
                            <Group>
                                <Text c="red" fw={700}>Erro no Processamento:</Text>
                                {/* @ts-ignore */}
                                <Text c="red" size="sm">{content.details || content.error}</Text>
                            </Group>
                            <Group>
                                <Button
                                    size="xs"
                                    color="teal"
                                    variant="filled"
                                    leftSection={<IconRefresh size={14} />}
                                    onClick={async () => {
                                        if (!chapter) return;
                                        setChapter({ ...chapter, status: 'PENDING' }); // Optimistic update

                                        try {
                                            // @ts-ignore
                                            await api.chapters.reprocess(chapter.id);
                                            // Polling will handle the rest
                                        } catch (e) {
                                            alert("Erro ao reiniciar processamento.");
                                            setChapter({ ...chapter, status: 'FAILED' }); // Revert on error
                                        }
                                    }}
                                >
                                    Tentar Novamente (Reprocessar IA)
                                </Button>
                                <Text size="xs" c="dimmed">Verifique sua Chave de API se o erro persistir.</Text>
                            </Group>
                        </Stack>
                    </div>
                )}

                <Timeline
                    totalDuration={videoDuration || 60}
                    currentTime={currentTime}
                    steps={(content.steps || []).map((s, i) => ({
                        id: i,
                        startTime: parseTimestamp(s.timestamp),
                        duration: s.duration || 5,
                        text: s.description,
                        color: i === activeStep ? '#228be6' : '#444'
                    }))}
                    onStepMove={handleStepMove}
                    onSeek={(t: number) => {
                        if (vidRef.current) vidRef.current.currentTime = t;
                    }}
                    onStepDoubleClick={handleStepDoubleClick}
                />
            </Card>

            {/* Editing Modal */}
            {editingStepIndex !== null && content.steps[editingStepIndex] && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card w={500} shadow="xl" radius="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Title order={4}>Editar Passo #{editingStepIndex + 1}</Title>
                            <ActionIcon onClick={handleModalClose} variant="subtle"><IconArrowLeft size={16} /></ActionIcon>
                        </Group>

                        <Stack>
                            <Textarea
                                label="Descrição / Legenda"
                                autosize minRows={3}
                                value={content.steps[editingStepIndex].description}
                                onChange={(e) => updateStep(editingStepIndex, 'description', e.target.value)}
                            />

                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Timestamp: {content.steps[editingStepIndex].timestamp}</Text>
                                <Button
                                    variant="light"
                                    leftSection={<IconRefresh size={16} />}
                                    color="orange"
                                    onClick={() => handleRegenerateAudio(editingStepIndex)}
                                >
                                    Regenerar Áudio
                                </Button>
                            </Group>

                            <Group mt="md" grow>
                                <Button color="red" variant="outline" onClick={() => handleDeleteStep(editingStepIndex)}>
                                    Excluir Passo
                                </Button>
                                <Button onClick={handleModalClose}>Concluir</Button>
                            </Group>
                        </Stack>
                    </Card>
                </div>
            )}

        </Container>
    );
}
