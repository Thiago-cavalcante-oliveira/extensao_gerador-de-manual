import { useRef, useEffect, useState } from 'react';
import { Box, Text, Tooltip, Group, ThemeIcon } from '@mantine/core';
import { IconMovie } from '@tabler/icons-react';

export interface TimelineStep {
    id: number; // Index
    startTime: number; // Seconds
    duration: number; // Seconds (audio length)
    text: string;
    color?: string;
}

interface TimelineProps {
    totalDuration: number;
    currentTime: number;
    steps: TimelineStep[];
    onStepMove: (index: number, newStartTime: number) => void;
    onSeek: (time: number) => void;
    onStepDoubleClick?: (index: number) => void;
}

export function Timeline({ totalDuration, currentTime, steps, onStepMove, onSeek, onStepDoubleClick }: TimelineProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const audioTrackRef = useRef<HTMLDivElement>(null);
    const [draggingId, setDraggingId] = useState<number | null>(null);

    // Calculate pixels per second based on container width
    const [pixelsPerSecond, setPixelsPerSecond] = useState(10);
    const [containerWidth, setContainerWidth] = useState(0);

    const updateScale = () => {
        if (trackRef.current && totalDuration > 0) {
            const width = trackRef.current.offsetWidth;
            setContainerWidth(width);
            setPixelsPerSecond(width / totalDuration);
        }
    };

    useEffect(() => {
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [totalDuration]);

    const handleSeek = (e: React.MouseEvent) => {
        // Prevent seek if dragging an item
        if (draggingId !== null) return;

        if (trackRef.current) {
            const rect = trackRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const time = x / pixelsPerSecond;
            onSeek(Math.max(0, Math.min(time, totalDuration)));
        }
    };

    const handleDragStart = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setDraggingId(index);
    };

    const handleDragEnd = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDraggingId(null);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingId !== null && trackRef.current) {
            const rect = trackRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const newTime = Math.max(0, x / pixelsPerSecond);
            onStepMove(draggingId, newTime);
        }
    };

    // Simulated Filmstrip: Create a frame every ~50px
    const frameCount = Math.floor(containerWidth / 80);
    const frames = Array.from({ length: frameCount || 10 });

    return (
        <Box
            mb="md"
            style={{ userSelect: 'none', position: 'relative' }}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onMouseMove={handleMouseMove}
            ref={trackRef}
        >
            {/* Playhead (Global Cursor) - Spans all tracks */}
            <Box
                w={2}
                h="100%"
                bg="red"
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: currentTime * pixelsPerSecond,
                    zIndex: 20,
                    pointerEvents: 'none',
                    boxShadow: '0 0 4px rgba(255,0,0,0.5)'
                }}
            />

            {/* Time Indicators */}
            <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">00:00</Text>
                <Text size="xs" c="dimmed">{formatTime(totalDuration)}</Text>
            </Group>

            {/* TRACK 1: VIDEO (Filmstrip visualization) */}
            <Box
                h={60}
                mb={4}
                style={{
                    backgroundColor: '#000',
                    borderRadius: 4,
                    overflow: 'hidden',
                    display: 'flex',
                    border: '1px solid #333',
                    cursor: 'pointer'
                }}
                onClick={handleSeek}
            >
                {frames.map((_, i) => (
                    <Box
                        key={i}
                        style={{
                            flex: 1,
                            borderRight: '1px solid #222',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.3
                        }}
                    >
                        <ThemeIcon variant="transparent" color="gray" size="lg">
                            <IconMovie />
                        </ThemeIcon>
                    </Box>
                ))}
            </Box>

            {/* TRACK 2: AUDIO / SUBTITLES */}
            <Box
                h={80} // Increased height for better readability
                ref={audioTrackRef}
                style={{
                    backgroundColor: '#1A1B1E',
                    position: 'relative',
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: '1px solid #333'
                }}
                onClick={(e) => {
                    // Allow seeking by clicking empty space in audio track too
                    handleSeek(e);
                }}
            >
                <Box
                    style={{
                        position: 'absolute',
                        top: 39,
                        left: 0,
                        right: 0,
                        height: 1,
                        backgroundColor: '#333'
                    }}
                />

                {/* Steps Blocks */}
                {steps.map((step) => {
                    const left = step.startTime * pixelsPerSecond;
                    const width = (step.duration || 5) * pixelsPerSecond;

                    return (
                        <Tooltip key={step.id} label="Clique duplo para editar">
                            <Box
                                style={{
                                    position: 'absolute',
                                    left,
                                    width,
                                    height: '80%',
                                    top: '10%',
                                    backgroundColor: step.color || '#228be6',
                                    borderRadius: 4,
                                    cursor: 'grab',
                                    opacity: 0.9,
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    justifyContent: 'flex-start',
                                    overflow: 'hidden',
                                    zIndex: 5,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                    padding: '4px 6px'
                                }}
                                onMouseDown={(e) => handleDragStart(e, step.id)}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    onStepDoubleClick?.(step.id);
                                }}
                            >
                                <Text size="0.65rem" fw={700} c="white" style={{ opacity: 0.8 }}>
                                    #{step.id + 1}
                                </Text>
                                <Text size="xs" c="white" style={{ fontSize: 11, lineHeight: 1.2 }}>
                                    {step.text}
                                </Text>
                            </Box>
                        </Tooltip>
                    );
                })}
            </Box>
        </Box>
    );
}

function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}
