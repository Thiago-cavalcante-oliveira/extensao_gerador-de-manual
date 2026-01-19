import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Filter, Heart, Play, Clock, Monitor, Box, User
} from 'lucide-react';
import { api } from '../services/api';

// Use a local interface to extend the Chapter with Viewer properties if strict typing needed, 
// or assume api returns extended type.
interface Chapter {
    id: number;
    title: string;
    video_url: string;
    status: string;
    created_at: string;
    system_name?: string;
    module_name?: string;
    audience?: string;
    functionality?: string;
    is_favorite?: boolean;
}

export function ViewerPage() {
    const navigate = useNavigate();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAudience, setFilterAudience] = useState('');
    const [filterFunc, setFilterFunc] = useState('');
    const [onlyFavorites, setOnlyFavorites] = useState(false);

    const fetchChapters = async () => {
        setLoading(true);
        try {
            const params: any = { only_favorites: onlyFavorites, published_only: true };
            if (filterAudience) params.audience = filterAudience;
            if (filterFunc) params.functionality = filterFunc;

            const res = await api.chapters.list(params);
            setChapters(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChapters();
    }, [onlyFavorites, filterAudience, filterFunc]); // Refetch on filter change

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const toggleFavorite = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            const res = await api.chapters.toggleFavorite(id);
            setChapters(prev => prev.map(c =>
                c.id === id ? { ...c, is_favorite: res.is_favorite } : c
            ));
        } catch (err) {
            console.error("Error toggling favorite", err);
        }
    };

    // Client-side search filtering (for title/system) in addition to server filters
    const filteredChapters = chapters.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.system_name && c.system_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex h-full bg-slate-50">
            {/* Sidebar Filters */}
            <aside className="w-64 bg-white border-r border-slate-200 p-6 hidden md:block overflow-y-auto">
                <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Filter size={20} /> Filtros
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Preferências</label>
                        <button
                            onClick={() => setOnlyFavorites(!onlyFavorites)}
                            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors ${onlyFavorites ? 'bg-red-50 text-red-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Heart size={18} fill={onlyFavorites ? "currentColor" : "none"} /> Favoritos
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Público Alvo</label>
                        <select
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            value={filterAudience}
                            onChange={e => setFilterAudience(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="Analista">Analistas</option>
                            <option value="Gerente">Gerentes</option>
                            <option value="Operacional">Operacional</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Funcionalidade</label>
                        <input
                            type="text"
                            placeholder="Ex: Cadastro..."
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            value={filterFunc}
                            onChange={e => setFilterFunc(e.target.value)}
                        />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Biblioteca de Tutoriais</h1>
                            <p className="text-slate-500 mt-1">Explore manuais em vídeo interativos.</p>
                        </div>

                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por título, sistema..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-20 text-slate-400">Carregando vídeos...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredChapters.map(video => (
                                <div key={video.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col h-full cursor-pointer" onClick={() => navigate(`/player/${video.id}`)}>

                                    {/* Thumbnail Area */}
                                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                                        <video src={video.video_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />

                                        {/* Overlay Play Button */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Play size={24} className="text-white ml-1" fill="currentColor" />
                                            </div>
                                        </div>

                                        {/* Badges */}
                                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                                            {video.audience && <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase rounded flex items-center gap-1"><User size={10} /> {video.audience}</span>}
                                        </div>

                                        {/* Favorite Button */}
                                        <button
                                            onClick={(e) => toggleFavorite(e, video.id)}
                                            className="absolute top-2 right-2 p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-red-500 hover:text-white transition-colors text-white"
                                        >
                                            <Heart size={16} fill={video.is_favorite ? "currentColor" : "none"} className={video.is_favorite ? "text-red-500" : ""} />
                                        </button>

                                        {/* Duration (Mocked/Future) */}
                                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-white text-xs font-medium font-mono">
                                            VIDEO
                                        </div>
                                    </div>

                                    {/* Info Area */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="text-xs font-semibold text-teal-600 mb-1 flex items-center gap-1">
                                            <Monitor size={12} /> {video.system_name || 'Geral'}
                                        </div>

                                        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-2" title={video.title}>
                                            {video.title}
                                        </h3>

                                        <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">
                                            {video.functionality || 'Sem descrição funcional.'}
                                        </p>

                                        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3 mt-auto">
                                            <span className="flex items-center gap-1">
                                                <Box size={12} /> {video.module_name || 'Módulo Base'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} /> {new Date(video.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredChapters.length === 0 && (
                                <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-slate-400">
                                    <Search size={48} className="mb-4 text-slate-300" />
                                    <p>Nenhum vídeo encontrado com estes filtros.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
