import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Loader, Box, Title, ActionIcon, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconHeart } from '@tabler/icons-react'; // Mantine uses tabler usually, but project uses lucide?
// Providing compatibility: Project seems to use lucide mostly in other files (Sidebar.tsx).
// Let's use lucide-react as in ViewerPage to keep consistent.
import { ArrowLeft, Heart, X } from 'lucide-react';

import { api } from '../services/api';
import type { Chapter } from '../types';

interface Step {
    timestamp: string;
    description: string;
    audio_url?: string;
}

interface ManualContent {
    title: string;
    steps: Step[];
}

// Extend Chapter to include fav
interface ChapterWithFav extends Chapter {
    is_favorite?: boolean;
}

export function PlayerPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [chapter, setChapter] = useState<ChapterWithFav | null>(null);
    const [content, setContent] = useState<ManualContent | null>(null);
    const [activeStep, setActiveStep] = useState<number>(-1);
    const vidRef = useRef<HTMLVideoElement>(null);
    const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

    useEffect(() => {
        if (!id) return;
        loadChapter();
    }, [id]);

    useEffect(() => {
        if (content) {
            audioRefs.current = audioRefs.current.slice(0, content.steps.length);
        }
    }, [content]);

    const loadChapter = async () => {
        try {
            // @ts-ignore
            const data = await api.chapters.get(Number(id));
            setChapter(data);
            if (data.content) {
                if (typeof data.content === 'string') {
                    setContent(JSON.parse(data.content));
                } else {
                    setContent(data.content as ManualContent);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const toggleFavorite = async () => {
        if (!chapter) return;
        try {
            const res = await api.chapters.toggleFavorite(chapter.id);
            setChapter(prev => prev ? { ...prev, is_favorite: res.is_favorite } : null);
        } catch (err) {
            console.error(err);
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
        let currentIdx = -1;
        for (let i = 0; i < content.steps.length; i++) {
            const time = parseTimestamp(content.steps[i].timestamp);
            if (time <= currentTime + 0.5) currentIdx = i;
            else break;
        }

        if (currentIdx !== activeStep) {
            setActiveStep(currentIdx);
            if (currentIdx !== -1 && audioRefs.current[currentIdx]) {
                audioRefs.current.forEach(a => a && !a.paused && a.pause());
                const audio = audioRefs.current[currentIdx];
                if (audio) {
                    audio.currentTime = 0;
                    audio.play().catch(() => { });
                }
            }
        }
    };

    if (!chapter || !content) return <Container py="xl" className="flex justify-center"><Loader /></Container>;

    const currentStepData = activeStep !== -1 ? content.steps[activeStep] : null;

    return (
        <div className="h-full flex flex-col">
            {/* Header / Nav */}
            <div className="mb-4 flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/library')}
                        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 font-medium transition-colors"
                    >
                        <ArrowLeft size={20} /> Voltar
                    </button>
                    <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                    <h1 className="text-lg font-bold text-slate-700 hidden md:block line-clamp-1">{chapter.title}</h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFavorite}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${chapter.is_favorite ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:bg-slate-50'}`}
                        title={chapter.is_favorite ? "Remover dos favoritos" : "Favoritar"}
                    >
                        <Heart size={20} fill={chapter.is_favorite ? "currentColor" : "none"} className={chapter.is_favorite ? "text-red-500" : ""} />
                        <span className="text-sm font-medium hidden sm:block">Favorito</span>
                    </button>

                    {/* Add a specialized Close button or just rely on 'Voltar'? User asked for a button that closes/returns.
                        The 'Voltar' button on the left already does this.
                        User said: "precisamos de um botao que feche o visualizado e volte para a tela de viwer".
                        Maybe they want a clear "X" on the right too? I'll add it for completeness as requested.
                    */}
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    <button
                        onClick={() => navigate('/library')}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Fechar Player"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Video Container */}
            {/* Using aspect-video or flex-1 to simple fill. User asked for padding (handled by parent 100%) and no overflow. */}
            <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl flex-1 max-h-[80vh] group">
                {/* Main Video */}
                <video
                    ref={vidRef}
                    src={chapter.video_url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                />

                {/* Hidden Audio Players for Sync */}
                <div style={{ display: 'none' }}>
                    {content.steps.map((step, idx) => (
                        step.audio_url && (
                            <audio
                                key={idx}
                                ref={el => { audioRefs.current[idx] = el; }}
                                src={step.audio_url}
                            />
                        )
                    ))}
                </div>

                {/* Subtitle Overlay */}
                {currentStepData && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[90%] md:w-[70%] text-center pointer-events-none">
                        <div className="bg-black/70 backdrop-blur-sm text-white px-6 py-4 rounded-xl shadow-lg border border-white/10 inline-block pointer-events-auto">
                            <h4 className="text-lg font-medium leading-relaxed drop-shadow-md">
                                {currentStepData.description}
                            </h4>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
