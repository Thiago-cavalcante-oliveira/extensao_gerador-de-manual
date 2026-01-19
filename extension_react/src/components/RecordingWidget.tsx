import { useState, useEffect, useRef } from 'react';
import {
    Pause, Square, Trash2, Maximize2, Minimize2, Play, Shield
} from 'lucide-react';
import { PrivacyEngine } from '../privacy-engine';

interface RecordingWidgetProps {
    chapterName: string;
    systemModule: string;
    onStop: () => void;
    onPause: () => void;
    onDiscard: () => void;
    initialPrivacyMode?: boolean;
}

export default function RecordingWidget({
    chapterName = "Novo Capítulo",
    systemModule = "FozDocs",
    onStop,
    onPause: _onPause, // Unused
    onDiscard,
    initialPrivacyMode = false,
    appConfig
}: RecordingWidgetProps & { appConfig?: any }) {

    // Status: setup (pre-gravacao) | countdown (3-2-1) | recording (gravando) | paused (smart pause)
    const [status, setStatus] = useState<'setup' | 'countdown' | 'recording' | 'paused'>(initialPrivacyMode ? 'setup' : 'recording');
    const [isWidgetMinimized, setIsWidgetMinimized] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [countdownVal, setCountdownVal] = useState(3);

    // Privacy Logic
    const [isPrivacyEnabled, setIsPrivacyEnabled] = useState(false);
    const [activeTool, setActiveTool] = useState<'mask' | 'blur'>('mask');

    // Resume Logic
    const [resumeCountdown, setResumeCountdown] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Recording Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const logoUrl = appConfig?.logo_url || (chrome?.runtime?.getURL ? chrome.runtime.getURL('logo_foz_iguacu.png') : 'logo_foz_iguacu.png');

    // Initial Setup
    useEffect(() => {
        const engine = PrivacyEngine.getInstance();
        setIsPrivacyEnabled(engine['isEnabled']);

        engine.subscribe((shouldPause) => {
            if (status === 'setup' || status === 'countdown') return;

            if (shouldPause) {
                // Pause recording logic? MediaRecorder pause()
                handlePauseRecording();
                setStatus('paused');
            } else if (status === 'paused') {
                handleResumeRecording();
                setStatus('recording');
                setResumeCountdown(null);
                setIsWidgetMinimized(true);
            }
        });
    }, [status]);

    // Timer Logic
    useEffect(() => {
        if (status !== 'recording' || isSaving) return;
        const timer = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearTimeout(timer);
    }, [status, isSaving]);

    // Countdown Logic (3, 2, 1 -> Start)
    useEffect(() => {
        if (status === 'countdown') {
            if (countdownVal > 0) {
                const timer = setTimeout(() => setCountdownVal(c => c - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                startMediaRecorder();
            }
        } else {
            setCountdownVal(3);
        }
    }, [status, countdownVal]);

    async function handleStartRecording() {
        try {
            // 1. Get Stream FIRST (User Gesture)
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: "browser",
                },
                audio: true
            });

            streamRef.current = stream;

            // Handle user stopping via browser UI
            stream.getVideoTracks()[0].onended = () => {
                handleStopClick();
            };

            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            // 2. Start Countdown
            console.log("Status: Setup -> Countdown");
            setStatus('countdown');

        } catch (err) {
            console.error("Error setup capture:", err);
            // If user cancels, we stay/return to setup
            setStatus('setup');
        }
    }

    function startMediaRecorder() {
        // 3. Start Recording AFTER countdown
        console.log("Status: Countdown -> Recording");
        setStatus('recording');
        setIsWidgetMinimized(true);

        const recorder = mediaRecorderRef.current;

        // Safety: Check if user cancelled stream during countdown
        if (!recorder || !recorder.stream.active) {
            console.warn("Stream inactive, cancelling.");
            setStatus('setup');
            return;
        }

        if (recorder.state === 'inactive') {
            setTimeout(() => {
                try {
                    recorder.start(1000);
                } catch (e) {
                    console.error("Start recorder failed", e);
                }
            }, 600); // Delay for UI repaint
        }
    }

    const handlePauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
        }
    };

    const handleResumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
        }
    };


    // Resume Countdown
    useEffect(() => {
        if (resumeCountdown === null) return;
        if (resumeCountdown > 0) {
            const timer = setTimeout(() => setResumeCountdown(resumeCountdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            PrivacyEngine.getInstance().forceResume();
            handleResumeRecording();
            setStatus('recording');
            setResumeCountdown(null);
        }
    }, [resumeCountdown]);



    const handleResumeClick = () => {
        setResumeCountdown(3);
    };

    const handleRemoveAll = () => {
        PrivacyEngine.getInstance().cleanup();
    };

    const handleStopClick = () => {
        if (!mediaRecorderRef.current) return;

        setIsSaving(true);
        mediaRecorderRef.current.stop();

        // Stop all tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        mediaRecorderRef.current.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            await uploadRecording(blob);
        };
    };

    const uploadRecording = async (blob: Blob) => {
        const formData = new FormData();
        formData.append('file', blob, 'capture.webm');
        formData.append('title', chapterName);
        // FIXME: module_id deve ser numérico. Estamos usando 1 como fallback se não vier no prop.
        // O prop systemModule atualmente deve ser o ID ou nome.
        // Vamos tentar converter. Se falhar, usa 1.
        let modId = parseInt(systemModule);
        if (isNaN(modId)) modId = 1;
        formData.append('module_id', modId.toString());

        try {
            const response = await fetch('http://localhost:8000/api/v1/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                console.log("Upload success!");
                alert("Gravação salva com sucesso!"); //TODO: Better UI
            } else {
                console.error("Upload failed", await response.text());
                alert("Erro ao salvar a gravação.");
            }
        } catch (error) {
            console.error("Network error during upload", error);
            alert("Erro de conexão ao salvar.");
        } finally {
            // Cleanup logic
            setTimeout(() => {
                PrivacyEngine.getInstance().cleanup();
                onStop(); // Close widget
            }, 500);
        }
    };

    const togglePrivacy = () => {
        const newState = !isPrivacyEnabled;
        setIsPrivacyEnabled(newState);
        const toolToUse = newState ? activeTool : activeTool;
        PrivacyEngine.getInstance().setConfig(newState, toolToUse);
    };

    const setPrivacyTool = (tool: 'mask' | 'blur') => {
        setActiveTool(tool);
        if (isPrivacyEnabled) {
            PrivacyEngine.getInstance().setConfig(true, tool);
        }
    };

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    // --- RENDER STATES ---

    // 0. SAVING
    if (isSaving) {
        return (
            <div className="fixed bottom-4 left-4 z-[9999] w-[300px] flex flex-col bg-slate-900/90 backdrop-blur-md font-sans text-white rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-pulse">
                <div className="flex flex-col items-center justify-center p-8 gap-4">
                    <img src={logoUrl} className="h-10 w-auto opacity-50 mb-2" alt="Logo" />
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <h3 className="text-lg font-bold text-teal-400">Salvando Vídeo...</h3>
                </div>
            </div>
        );
    }

    // 0.5 COUNTDOWN
    if (status === 'countdown') {
        return (
            <div className="fixed inset-0 z-[2147483647] flex items-center justify-center font-sans pointer-events-none">
                <div className="w-48 h-48 bg-teal-500/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(20,184,166,0.5)] border-4 border-white/20 animate-ping">
                    <span className="text-[120px] font-black text-white drop-shadow-md leading-none pb-4">{countdownVal}</span>
                </div>
            </div>
        );
    }

    // 1. SETUP MODE
    if (status === 'setup') {
        return (
            <div className="fixed bottom-4 left-4 z-[9999] w-[320px] flex flex-col bg-slate-900/95 backdrop-blur-md font-sans text-white rounded-xl shadow-2xl border border-teal-500/50 overflow-hidden animate-in slide-in-from-bottom-10">
                <div className="bg-teal-600/20 p-3 border-b border-teal-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                        <span className="font-bold text-xs uppercase tracking-wide text-teal-300">Preparar Gravação</span>
                    </div>
                    <img src={logoUrl} className="h-6 w-auto opacity-80" alt="Logo" />
                </div>

                <div className="p-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Título</label>
                        <span className="font-semibold text-white">{chapterName}</span>
                    </div>

                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Shield size={16} className={isPrivacyEnabled ? "text-teal-400" : "text-slate-500"} />
                                <span className={`text-xs font-bold ${isPrivacyEnabled ? "text-teal-200" : "text-slate-400"}`}>Modo Privacidade</span>
                            </div>
                            <div
                                onClick={togglePrivacy}
                                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${isPrivacyEnabled ? 'bg-teal-600' : 'bg-slate-600'}`}
                            >
                                <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full shadow transition-transform ${isPrivacyEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>

                        {isPrivacyEnabled && (
                            <div className="flex flex-col gap-2 mt-1">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setPrivacyTool('mask')}
                                        title="Oculta o conteúdo com bolinhas, simulando uma senha. Ideal para textos sensíveis."
                                        className={`flex items-center justify-center gap-1.5 p-2 rounded border transition-all ${activeTool === 'mask' ? 'bg-teal-500/20 border-teal-500 text-teal-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                    >
                                        <Square size={12} fill="currentColor" className="opacity-50" />
                                        <span className="text-[10px] font-bold">Mascarar</span>
                                    </button>
                                    <button
                                        onClick={() => setPrivacyTool('blur')}
                                        title="Aplica um desfoque forte tornando o conteúdo ilegível. Ideal para imagens ou áreas grandes."
                                        className={`flex items-center justify-center gap-1.5 p-2 rounded border transition-all ${activeTool === 'blur' ? 'bg-teal-500/20 border-teal-500 text-teal-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                    >
                                        <div className="w-3 h-3 bg-current blur-[2px] rounded-sm opacity-50"></div>
                                        <span className="text-[10px] font-bold">Borrar</span>
                                    </button>
                                </div>
                                <button onClick={handleRemoveAll} className="flex items-center justify-center gap-1.5 p-1.5 rounded border border-white/5 bg-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-all text-[10px]">
                                    <Trash2 size={10} /> Limpar Todas as Máscaras
                                </button>
                            </div>
                        )}

                        <p className="text-[10px] text-slate-400 leading-tight">
                            {isPrivacyEnabled
                                ? "Selecione o efeito e clique nos elementos da página."
                                : "Ative para ocultar dados sensíveis."}
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-amber-500/80 font-mono bg-amber-500/5 p-2 rounded border border-amber-500/10">
                        <span className="font-bold">DICA:</span> Pressione <kbd className="bg-amber-900/50 px-1 rounded text-amber-200">ALT</kbd> para PAUSAR
                    </div>

                    <button
                        onClick={handleStartRecording}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold shadow-lg transition-all active:scale-95"
                    >
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                        INICIAR AGORA
                    </button>

                    <button onClick={onDiscard} className="text-xs text-slate-500 hover:text-white underline text-center">
                        Cancelar
                    </button>
                </div>
            </div>
        );
    }

    // 2. PAUSED (Smart Pause)
    if (status === 'paused') {
        return (
            <div className="fixed inset-0 z-[2147483647] flex items-center justify-center font-sans">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in-95">
                    <img src={logoUrl} className="h-8 w-auto mb-2" alt="Logo" />

                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                            {resumeCountdown !== null ? (
                                <span className="text-3xl font-bold font-mono">{resumeCountdown}</span>
                            ) : (
                                <Pause size={32} />
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            {resumeCountdown !== null ? "Retomando..." : "Gravação em Pausa"}
                        </h2>
                    </div>

                    {resumeCountdown === null && (
                        <div className="flex flex-col gap-3 w-full">
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={handleResumeClick}
                                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-full font-bold shadow-lg"
                                >
                                    <Play size={20} /> Retomar
                                </button>
                                <button
                                    onClick={handleStopClick}
                                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-full font-bold"
                                >
                                    <Square size={18} /> Finalizar
                                </button>
                            </div>

                            <button onClick={() => { PrivacyEngine.getInstance().cleanup(); onDiscard(); }} className="text-xs text-red-400 hover:text-red-500 underline text-center mt-2 flex items-center justify-center gap-1">
                                <Trash2 size={12} /> Descartar gravação (sem salvar)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 3. MINIMIZED RECORDING
    if (isWidgetMinimized) {
        return (
            <div className="fixed bottom-4 left-4 z-[9999] font-sans">
                <div
                    onClick={() => setIsWidgetMinimized(false)}
                    className="group flex items-center gap-0 bg-white border border-slate-200 shadow-2xl rounded-full pl-1 pr-4 py-1 cursor-pointer hover:scale-105 transition-all animate-in slide-in-from-bottom-4"
                >
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20 animate-ping"></span>
                        <div className="relative bg-white rounded-full p-1 border border-slate-100 z-10">
                            <img src={logoUrl} className="w-full h-full object-contain p-1.5" alt="Rec" />
                        </div>
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-600 border-2 border-white rounded-full z-20 animate-pulse"></div>
                    </div>
                    <div className="flex flex-col ml-2">
                        <span className="text-[10px] font-black text-slate-800 leading-none">GRAVANDO</span>
                        <span className="text-[10px] font-mono text-red-600 leading-none mt-0.5">{formatTime(seconds)}</span>
                    </div>
                    <Maximize2 size={14} className="ml-3 text-slate-400 group-hover:text-teal-600" />
                </div>
            </div>
        );
    }

    // 4. EXPANDED RECORDING
    return (
        <div className="fixed bottom-4 left-4 z-[9999] w-[300px] flex flex-col bg-slate-900/90 backdrop-blur-md font-sans text-white rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center p-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
                    <span className="font-bold text-xs tracking-wide uppercase text-red-400">Gravando Tela</span>
                </div>
                <img src={logoUrl} className="h-4 w-auto opacity-50" alt="Logo" />
                <button
                    onClick={() => setIsWidgetMinimized(true)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <Minimize2 size={16} />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 py-8">
                <div className="text-[2.5rem] font-mono font-bold tracking-tighter tabular-nums text-white drop-shadow-lg leading-none">
                    {formatTime(seconds)}
                </div>
                <div className="mt-3 flex flex-col items-center text-center">
                    <p className="text-sm font-medium text-slate-300 leading-tight">{chapterName}</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{systemModule}</p>
                </div>
            </div>

            <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/5">
                <div className="flex items-center justify-center gap-6">
                    <button onClick={onDiscard} className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full border border-white/10 group-hover:bg-red-500/20 group-hover:text-red-400 group-hover:border-red-500/50 transition-all">
                            <Trash2 size={16} />
                        </div>
                        <span className="text-[9px] text-slate-400">Descartar</span>
                    </button>
                    <button
                        onClick={togglePrivacy}
                        className={`flex flex-col items-center gap-1 group ${isPrivacyEnabled ? 'text-teal-400' : ''}`}
                    >
                        <div className={`w-14 h-14 flex items-center justify-center rounded-full shadow-lg border transition-all ${isPrivacyEnabled ? 'bg-teal-500/20 border-teal-500 text-teal-400' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}>
                            <Shield size={24} />
                        </div>
                        <span className="text-[9px] text-slate-500">{isPrivacyEnabled ? 'Privacidade ON' : 'Privacidade OFF'}</span>
                    </button>
                    <button
                        onClick={handleStopClick}
                        className="flex flex-col items-center gap-1 group"
                    >
                        <div className="w-10 h-10 flex items-center justify-center bg-red-600 rounded-full shadow-lg shadow-red-900/50 hover:bg-red-500 active:scale-95 transition-all">
                            <Square size={16} fill="currentColor" />
                        </div>
                        <span className="text-[9px] text-slate-400">Finalizar</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
