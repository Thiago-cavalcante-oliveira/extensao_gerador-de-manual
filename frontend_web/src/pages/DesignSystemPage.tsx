import { Container, Title, Text, Button, Group, Stack, Paper, TextInput, Select, Switch, Badge, Grid, ColorInput, Slider, LoadingOverlay } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { notifications } from '@mantine/notifications';
import logoFoz from '../assets/logo_foz.png';

export function DesignSystemPage() {
    // const theme = useMantineTheme();
    const [loading, setLoading] = useState(false);

    // Config State
    const [config, setConfig] = useState({
        primary_color: '#0099ff',
        secondary_color: '#2b8a3e',
        logo_url: '',
        blur_intensity: 6,
        mask_style: 'dots',
        privacy_default_enabled: false,
        intro_video_url: '',
        outro_video_url: ''
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const data = await api.configuration.get();
            setConfig(data);
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Erro', message: 'Falha ao carregar configurações.', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.configuration.update(config);
            notifications.show({ title: 'Sucesso', message: 'Configurações salvas!', color: 'green' });
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Erro', message: 'Falha ao salvar.', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size="lg" py="xl">
            <Stack gap="xl">
                <Group justify="space-between">
                    <Title order={2}>Central de Configurações</Title>
                    <Button leftSection={<IconDeviceFloppy size={20} />} onClick={handleSave} loading={loading}>
                        Salvar Alterações
                    </Button>
                </Group>

                {/* 1. Identity / Branding Config */}
                <Paper withBorder p="md" radius="md" pos="relative">
                    <LoadingOverlay visible={loading} />
                    <Title order={3} mb="md">Identidade Visual</Title>
                    <Grid>
                        <Grid.Col span={6}>
                            <Stack>
                                <ColorInput
                                    label="Cor Primária"
                                    value={config.primary_color}
                                    onChange={(v) => setConfig({ ...config, primary_color: v })}
                                />
                                <ColorInput
                                    label="Cor Secundária"
                                    value={config.secondary_color}
                                    onChange={(v) => setConfig({ ...config, secondary_color: v })}
                                />
                                <TextInput
                                    label="URL do Logo"
                                    value={config.logo_url || ''}
                                    onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                                />
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Stack align="center" justify="center" h="100%" bg="gray.0" p="md" style={{ borderRadius: '8px' }}>
                                <Text size="sm" fw={500}>Visualizar</Text>
                                <img src={config.logo_url || logoFoz} alt="Logo" style={{ height: 60, objectFit: 'contain' }} />
                                {config.logo_url && <Badge color="green">Customizado</Badge>}
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Paper>

                {/* 2. Recorder Config */}
                <Paper withBorder p="md" radius="md" pos="relative">
                    <Title order={3} mb="md">Gravador (Extensão)</Title>
                    <Grid>
                        <Grid.Col span={6}>
                            <Stack>
                                <Select
                                    label="Estilo da Máscara"
                                    data={[
                                        { value: 'dots', label: 'Bolinhas (Senha)' },
                                        { value: 'solid', label: 'Tarja Sólida' },
                                        { value: 'blur', label: 'Borrão' }
                                    ]}
                                    value={config.mask_style}
                                    onChange={(v) => setConfig({ ...config, mask_style: v || 'dots' })}
                                />

                                <div>
                                    <Text size="sm" fw={500} mb="xs">Blur (px)</Text>
                                    <Group>
                                        <Slider
                                            flex={1}
                                            min={0} max={20}
                                            value={config.blur_intensity}
                                            onChange={(v) => setConfig({ ...config, blur_intensity: v })}
                                        />
                                        <Badge variant="outline">{config.blur_intensity}px</Badge>
                                    </Group>
                                </div>
                                <Switch
                                    label="Privacidade Padrão"
                                    checked={config.privacy_default_enabled}
                                    onChange={(e) => setConfig({ ...config, privacy_default_enabled: e.currentTarget.checked })}
                                />
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Paper p="md" bg="gray.1">
                                <Text size="sm" fw={700} c="dimmed">VISUALIZAÇÃO DO WIDGET</Text>
                                <div style={{ border: `1px solid ${config.primary_color}`, padding: '10px', background: 'white', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'red' }}>REC</span>
                                        <img src={config.logo_url || logoFoz} style={{ height: '15px' }} />
                                    </div>
                                    <div style={{ background: '#f8f9fa', padding: '5px', borderRadius: '4px' }}>
                                        {config.mask_style === 'dots' && '••••••••'}
                                        {config.mask_style === 'solid' && <div style={{ height: 10, background: 'black', width: 50 }} />}
                                        {config.mask_style === 'blur' && <span style={{ filter: `blur(${config.blur_intensity}px)` }}>Texto</span>}
                                    </div>
                                </div>
                            </Paper>
                        </Grid.Col>
                    </Grid>
                </Paper>

                {/* 3. Branding Videos */}
                <Paper withBorder p="md" radius="md">
                    <Title order={3} mb="md">Vídeo Branding (Stitching)</Title>
                    <Grid>
                        <Grid.Col span={6}>
                            <Text size="sm" mb="xs" fw={500}>Vídeo de Abertura (Intro)</Text>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="file"
                                    accept="video/mp4,video/quicktime"
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                    onChange={async (e) => {
                                        if (e.target.files?.[0]) {
                                            const file = e.target.files[0];
                                            setLoading(true);
                                            try {
                                                const res = await api.configuration.uploadAsset('intro', file);
                                                setConfig({ ...config, intro_video_url: res.url });
                                                notifications.show({ title: 'Sucesso', message: 'Intro enviada!', color: 'green' });
                                            } catch (err) {
                                                notifications.show({ title: 'Erro', message: 'Falha no upload', color: 'red' });
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                />
                                {/*config.intro_video_url && <Badge color="green">OK</Badge>*/}
                            </div>
                            {config.intro_video_url && <Text size="xs" c="dimmed" mt={1}>Atual: {config.intro_video_url}</Text>}
                        </Grid.Col>

                        <Grid.Col span={6}>
                            <Text size="sm" mb="xs" fw={500}>Vídeo de Encerramento (Outro)</Text>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="file"
                                    accept="video/mp4,video/quicktime"
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                    onChange={async (e) => {
                                        if (e.target.files?.[0]) {
                                            const file = e.target.files[0];
                                            setLoading(true);
                                            try {
                                                const res = await api.configuration.uploadAsset('outro', file);
                                                setConfig({ ...config, outro_video_url: res.url });
                                                notifications.show({ title: 'Sucesso', message: 'Outro enviada!', color: 'green' });
                                            } catch (err) {
                                                notifications.show({ title: 'Erro', message: 'Falha no upload', color: 'red' });
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                />
                            </div>
                            {config.outro_video_url && <Text size="xs" c="dimmed" mt={1}>Atual: {config.outro_video_url}</Text>}
                        </Grid.Col>
                    </Grid>
                </Paper>
            </Stack>
        </Container>
    );
}
