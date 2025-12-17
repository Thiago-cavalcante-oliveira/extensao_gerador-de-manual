import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Loader, Box, Title } from '@mantine/core';
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

export function PlayerPage() {
    const { id } = useParams();
    const [chapter, setChapter] = useState<Chapter | null>(null);
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

    if (!chapter || !content) return <Container py="xl"><Loader /></Container>;

    const currentStepData = activeStep !== -1 ? content.steps[activeStep] : null;

    return (
        <Box style={{ width: '100vw', height: '100vh', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
            {/* Main Video */}
            <video
                ref={vidRef}
                src={chapter.video_url}
                controls
                autoPlay
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
                <Box
                    style={{
                        position: 'absolute',
                        bottom: 80,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '16px 24px',
                        borderRadius: 8,
                        maxWidth: '80%',
                        textAlign: 'center',
                        zIndex: 10
                    }}
                >
                    <Title order={4} mb={0} style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                        {currentStepData.description}
                    </Title>
                </Box>
            )}
        </Box>
    );
}
