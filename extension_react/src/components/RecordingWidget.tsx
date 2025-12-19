import { useState, useEffect } from 'react';
import {
    Pause, Square, Trash2, Maximize2, Minimize2, Play
} from 'lucide-react';
import { PrivacyEngine } from '../privacy-engine';

interface RecordingWidgetProps {
    chapterName: string;
    systemModule: string;
    onStop: () => void;
    onPause: () => void;
    onDiscard: () => void;
}

export default function RecordingWidget({
    chapterName = "Novo Capítulo",
    systemModule = "FozDocs",
    onStop,
    onPause: _onPause, // Unused
    onDiscard
}: RecordingWidgetProps) {

    const [isWidgetMinimized, setIsWidgetMinimized] = useState(true); // Default to Minimized (Bolinha)
    const [seconds, setSeconds] = useState(0);
    const [isSmartPaused, setIsSmartPaused] = useState(false);
    const [resumeCountdown, setResumeCountdown] = useState<number | null>(null);

    // Subscribe to Privacy Engine
    useEffect(() => {
        PrivacyEngine.getInstance().subscribe((paused) => {
            setIsSmartPaused(paused);
            if (!paused) {
                setResumeCountdown(null);
                setIsWidgetMinimized(true); // Collapse back to 'Bolinha' on resume
            }
        });
    }, []);

    // Main Timer
    useEffect(() => {
        if (isSmartPaused) return;
        const timer = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, [isSmartPaused]);

    // Resume Countdown Timer
    useEffect(() => {
        if (resumeCountdown === null) return;
        if (resumeCountdown > 0) {
            const timer = setTimeout(() => setResumeCountdown(resumeCountdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Countdown finished, resume
            PrivacyEngine.getInstance().forceResume();
            setResumeCountdown(null);
        }
    }, [resumeCountdown]);

    const handleResumeClick = () => {
        setResumeCountdown(3);
    };

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    // --- RENDER ---

    // 1. SMART PAUSE OVERLAY (Takes precedence)
    if (isSmartPaused) {
        return (
            <div className="fixed inset-0 z-[2147483647] flex items-center justify-center font-sans">
                {/* Backdrop - Blur effect */}
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>

                <div className="relative bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                            {resumeCountdown !== null ? (
                                <span className="text-3xl font-bold font-mono">{resumeCountdown}</span>
                            ) : (
                                <Pause size={32} />
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            {resumeCountdown !== null ? "Retomando..." : "Gravação em Pausa (Smart Pause)"}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                            {resumeCountdown !== null
                                ? "Prepare-se para continuar..."
                                : "Solte a tecla ALT ou clique abaixo para continuar."}
                        </p>
                    </div>

                    {resumeCountdown === null && (
                        <div className="flex gap-4">
                            <button
                                onClick={handleResumeClick}
                                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-teal-900/20 transition-all hover:scale-105"
                            >
                                <Play size={20} />
                                Retomar Gravação
                            </button>
                            <button
                                onClick={onStop}
                                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-full font-bold transition-colors"
                            >
                                <Square size={18} />
                                Finalizar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 2. Widget Minimizado
    if (isWidgetMinimized) {
        return (
            <div className="fixed bottom-4 left-4 z-[9999] font-sans">
                <div
                    onClick={() => setIsWidgetMinimized(false)}
                    className="group flex items-center gap-0 bg-white border border-slate-200 shadow-2xl rounded-full pl-1 pr-4 py-1 cursor-pointer hover:scale-105 transition-all animate-in slide-in-from-bottom-4 duration-500"
                >
                    {/* Logo Pulsando */}
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20 animate-ping"></span>
                        <div className="relative bg-white rounded-full p-1 border border-slate-100 z-10">
                            <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/video.svg" className="w-full h-full object-contain p-1" alt="Rec" />
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

    // 3. Widget Expandido
    return (
        <div className="fixed bottom-4 left-4 z-[9999] w-[300px] flex flex-col bg-slate-900/90 backdrop-blur-md font-sans text-white rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="flex justify-between items-center p-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
                    <span className="font-bold text-xs tracking-wide uppercase text-red-400">Gravando Tela</span>
                </div>
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

            {/* Action Bar */}
            <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/5">
                <div className="flex items-center justify-center gap-6">
                    <button onClick={onDiscard} className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full border border-white/10 group-hover:bg-red-500/20 group-hover:text-red-400 group-hover:border-red-500/50 transition-all">
                            <Trash2 size={16} />
                        </div>
                        <span className="text-[9px] text-slate-400">Descartar</span>
                    </button>

                    <button className="flex flex-col items-center gap-1 group opacity-50 cursor-not-allowed" title="Use Alt para Smart Pause">
                        <div className="w-14 h-14 flex items-center justify-center bg-white/5 text-slate-400 rounded-full shadow-none border border-white/10">
                            <Pause size={24} fill="currentColor" />
                        </div>
                        <span className="text-[9px] text-slate-500">Segure Alt</span>
                    </button>

                    <button
                        onClick={onStop}
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
