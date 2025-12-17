import { useState } from 'react';
import { Button, Container, Stack, Title, Switch, Group, Badge, Paper } from '@mantine/core';

interface RecorderControlsProps {
    systemId: string;
    moduleId: string;
    onCancel: () => void;
}

export function RecorderControls({ systemId, moduleId, onCancel }: RecorderControlsProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [privacyMode, setPrivacyMode] = useState(false);

    const handleStart = async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab?.id) {
                console.error("Nenhuma aba ativa encontrada.");
                return;
            }

            // Injeta o content.js
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"]
            });

            // Pequeno delay para garantir carregamento
            await new Promise(resolve => setTimeout(resolve, 500));

            // Envia mensagem de inicialização
            // O título será "Manual - {System} > {Module}" por padrão se não tiver input específico,
            // mas aqui podemos melhorar pedindo um título antes. Por enquanto, usaremos um genérico.
            const manualTitle = `Manual ${systemId}-${moduleId}`;

            await chrome.tabs.sendMessage(tab.id, {
                action: "INIT_RECORDER",
                title: manualTitle,
                moduleId: moduleId,
                isPrivacyMode: privacyMode
            });

            // Fecha o popup para não atrapalhar
            window.close();

        } catch (err) {
            console.error("Erro ao iniciar gravação:", err);
            alert("Erro ao iniciar: " + (err as Error).message);
        }
    };

    const handleStop = () => {
        console.log("Parando gravação...");
        setIsRecording(false);
        onCancel(); // Volta pro dashboard ou fecha
    };

    return (
        <Container size="xs" mt="md">
            <Paper withBorder p="md" bg={isRecording ? 'red.0' : 'white'}>
                <Stack align="center">
                    <Title order={4}>Gravador</Title>

                    <Group>
                        <Badge color="gray">Sys: {systemId}</Badge>
                        <Badge color="gray">Mod: {moduleId}</Badge>
                    </Group>

                    <Switch
                        label="Modo Privacidade (Ocultar dados)"
                        checked={privacyMode}
                        onChange={(event) => setPrivacyMode(event.currentTarget.checked)}
                        disabled={isRecording}
                    />

                    {!isRecording ? (
                        <Button color="red" onClick={handleStart} fullWidth>
                            🔴 Iniciar Gravação
                        </Button>
                    ) : (
                        <Button variant="outline" color="gray" onClick={handleStop} fullWidth>
                            ⏹️ Parar
                        </Button>
                    )}

                    <Button variant="subtle" size="xs" onClick={onCancel} disabled={isRecording}>
                        Cancelar
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
}
