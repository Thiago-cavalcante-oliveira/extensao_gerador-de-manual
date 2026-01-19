import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Filter, Plus, Search, Loader2, CheckCircle2, Edit3, AlertCircle, Clock, Upload, Play
} from 'lucide-react';
import { api } from '../services/api';

type VideoStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DRAFT';

// ... (keep interfaces and StatusBadge same)

interface Chapter {
    id: number;
    title: string;
    video_url: string;
    status: VideoStatus;
    created_at: string;
    system_name?: string;
    module_name?: string;
}

const StatusBadge = ({ status }: { status: VideoStatus }) => {
    const config: Record<string, any> = {
        'COMPLETED': { color: 'bg-green-100 text-green-700 border-green-200', label: 'Publicado', Icon: CheckCircle2 },
        'DRAFT': { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Rascunho', Icon: Edit3 },
        'PROCESSING': { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Processando...', Icon: Loader2 },
        'FAILED': { color: 'bg-red-50 text-red-700 border-red-200', label: 'Erro', Icon: AlertCircle },
        'PENDING': { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Pendente', Icon: Clock },
    };

    const current = config[status] || config['PENDING'];
    const { Icon } = current;

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${current.color}`}>
            <Icon size={12} className={status === 'PROCESSING' ? 'animate-spin' : ''} />
            {current.label}
        </span>
    );
};
export function VideosPage() {
    const navigate = useNavigate();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [publishingId, setPublishingId] = useState<number | null>(null);

    const fetchChapters = async () => {
        try {
            const res = await api.get('/chapters');
            setChapters(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChapters();
    }, []);

    const handleEdit = (id: number) => {
        navigate(`/editor/${id}`);
    };

    const handlePublish = async (id: number) => {
        if (!confirm("Deseja realmente publicar este vídeo? Ele ficará disponível como 'Concluído'.")) return;
        setPublishingId(id);
        try {
            await api.chapters.publish(id);
            // Refresh local state without full reload
            setChapters(prev => prev.map(c => c.id === id ? { ...c, status: 'COMPLETED' } : c));
        } catch (err) {
            alert("Erro ao publicar.");
        } finally {
            setPublishingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gestão de Tutoriais</h1>
                    <p className="text-sm text-slate-500">Administre o acervo de conhecimento.</p>
                </div>
                {/* Search Bar... kept simple */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none min-w-[200px]">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-teal-600" /></div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {chapters.map((video) => (
                        <div key={video.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden relative">
                            {/* Thumbnail */}
                            <div className="relative aspect-video bg-slate-100 overflow-hidden group/thumb cursor-pointer" onClick={() => navigate(`/player/${video.id}`)}>
                                <video src={video.video_url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/10 transition-colors flex items-center justify-center">
                                    <Play className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow-lg" size={40} fill="currentColor" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <StatusBadge status={video.status} />
                                </div>
                                <h3 className="font-bold text-slate-800 leading-tight mb-3 line-clamp-2" title={video.title}>{video.title}</h3>

                                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <div className="text-xs text-slate-500 flex-1 truncate">
                                        {video.system_name && <span>{video.system_name}</span>}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(video.id)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit3 size={16} />
                                        </button>

                                        {video.status !== 'COMPLETED' && (
                                            <button
                                                onClick={() => handlePublish(video.id)}
                                                disabled={publishingId === video.id}
                                                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Publicar"
                                            >
                                                {publishingId === video.id ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {chapters.length === 0 && (
                        <div className="col-span-full text-center p-10 text-slate-400">Nenhum tutorial encontrado.</div>
                    )}
                </div>
            )}
        </div>
    );
}
