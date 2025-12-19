import { useState, useEffect } from 'react';
import { useSystems } from '../hooks/useSystems';
import { ConfigScreen } from './ConfigScreen';
import { CountdownScreen } from './CountdownScreen';

export default function ExtensionPopup() {
    // Estados de Fluxo
    const [status, setStatus] = useState<'idle' | 'countdown'>('idle');
    const [count, setCount] = useState(3);
    const [isCounting, setIsCounting] = useState(false);

    // Estados de Configuração
    const [privacyMode, setPrivacyMode] = useState(false);
    const [activeTool, setActiveTool] = useState<'mask' | 'blur'>('mask');
    const [mode, setMode] = useState('new');
    const [captureSource, setCaptureSource] = useState<'tab' | 'window'>('tab');

    // Dados da API
    const { systems, modules, loading, error } = useSystems();
    const [selectedSystem, setSelectedSystem] = useState<string>('');
    const [selectedModule, setSelectedModule] = useState<string>('');
    const [chapterName, setChapterName] = useState('');
    const [audience, setAudience] = useState<string[]>([]); // Multi-select array

    // Lógica de Contagem Regressiva
    useEffect(() => {
        let timer: any;
        if (status === 'countdown' && isCounting) {
            if (count > 0) {
                timer = setTimeout(() => setCount(count - 1), 1000);
            } else {
                handleStartRecording();
            }
        } else if (status === 'idle') {
            setCount(3);
            setIsCounting(false);
        }
        return () => clearTimeout(timer);
    }, [status, count, isCounting]);

    const handleStartRecording = () => {
        // Enviar mensagem para o Background Script
        chrome.runtime.sendMessage({
            type: 'START_RECORDING',
            payload: {
                systemId: selectedSystem,
                moduleId: selectedModule,
                chapterName: chapterName || 'Novo Capítulo',
                privacyMode,
                activeTool,
                captureSource,
                audience
            }
        });
        window.close();
    };

    const startProcess = () => {
        if (!selectedSystem || !selectedModule) {
            alert("Selecione Sistema e Módulo!");
            return;
        }
        setStatus('countdown');
        setIsCounting(false);
    };

    const confirmStartCount = () => {
        setIsCounting(true);
        // Show Red Border on Active Tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_PREVIEW_FRAME' });
            }
        });
    };

    const cancelCountdown = () => {
        setStatus('idle');
        // Hide Red Border
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'HIDE_PREVIEW_FRAME' });
            }
        });
    };

    // Filtra módulos pelo sistema selecionado
    const filteredModules = systems.length > 0 ? modules.filter((m: any) => m.system_id === selectedSystem) : [];

    return (
        <div className="w-[380px] h-[600px] bg-white relative">
            {status === 'idle' && (
                <ConfigScreen
                    systems={systems} modules={modules} filteredModules={filteredModules}
                    selectedSystem={selectedSystem} setSelectedSystem={setSelectedSystem}
                    selectedModule={selectedModule} setSelectedModule={setSelectedModule}
                    chapterName={chapterName} setChapterName={setChapterName}
                    audience={audience} setAudience={setAudience}
                    mode={mode} setMode={setMode}
                    captureSource={captureSource} setCaptureSource={setCaptureSource}
                    privacyMode={privacyMode} setPrivacyMode={setPrivacyMode}
                    activeTool={activeTool} setActiveTool={setActiveTool}
                    loading={loading} error={error}
                    onStart={startProcess}
                />
            )}
            {status === 'countdown' && (
                <CountdownScreen
                    count={count}
                    isCounting={isCounting}
                    onConfirmStart={confirmStartCount}
                    onCancel={cancelCountdown}
                    captureSource={captureSource}
                />
            )}
        </div>
    );
}
