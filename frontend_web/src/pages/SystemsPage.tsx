import { useEffect, useState } from 'react';
import {
    Building, Plus, Search, Layers, Edit3, Trash2, ChevronRight, Check, X,
    BrainCircuit, Save, Database
} from 'lucide-react';
import { api } from '../services/api';

// --- Types ---
interface Module {
    id: number;
    system_id: number;
    name: string;
    context_prompt?: string;
    glossary?: string; // Optional in frontend, might not be in DB yet
    audiences: string[]; // Mock for now if not in DB
}

interface System {
    id: number;
    name: string;
    description?: string; // Mapped to context_prompt
    icon: string;
    modules: Module[];
}

// --- Components ---

export function SystemsPage() {
    const [systems, setSystems] = useState<System[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSystemId, setActiveSystemId] = useState<number | null>(null);

    // UI State
    const [editingSystem, setEditingSystem] = useState<System | 'new' | null>(null);
    const [editingModule, setEditingModule] = useState<Module | 'new' | null>(null);

    // Fetch Systems
    const fetchSystems = async () => {
        try {
            const res = await api.get('/systems');
            const data: System[] = res.data.map((s: any) => ({
                ...s,
                description: s.context_prompt, // Map backend 'context_prompt' to UI 'description'
                modules: s.modules?.map((m: any) => ({
                    ...m,
                    audiences: [] // Mock
                })) || []
            }));
            setSystems(data);
            if (data.length > 0 && !activeSystemId) {
                setActiveSystemId(data[0].id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSystems();
    }, []);

    const activeSystem = systems.find(s => s.id === activeSystemId);
    const activeModules = activeSystem?.modules || [];

    // --- Handlers: Systems ---

    const handleSaveSystem = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const desc = (form.elements.namedItem('description') as HTMLTextAreaElement).value;

        try {
            if (editingSystem === 'new') {
                const res = await api.post('/systems', { name, context_prompt: desc });
                // Refresh list
                await fetchSystems();
                setActiveSystemId(res.data.id);
            } else if (editingSystem && typeof editingSystem !== 'string') {
                await api.put(`/systems/${editingSystem.id}`, { name, context_prompt: desc });
                await fetchSystems();
            }
            setEditingSystem(null);
        } catch (err) {
            alert("Erro ao salvar sistema");
        }
    };

    const handleDeleteSystem = async (id: number) => {
        if (!window.confirm("Atenção: Excluir o sistema apagará todos os módulos associados. Continuar?")) return;
        try {
            await api.delete(`/systems/${id}`);
            setSystems(prev => prev.filter(s => s.id !== id));
            if (activeSystemId === id) setActiveSystemId(null);
        } catch (err) {
            alert("Erro ao excluir sistema");
        }
    };

    // --- Handlers: Modules ---

    const handleSaveModule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSystem) return;

        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const desc = (form.elements.namedItem('description') as HTMLTextAreaElement).value;

        try {
            if (editingModule === 'new') {
                await api.post(`/systems/${activeSystem.id}/modules`, { name, context_prompt: desc });
            } else if (editingModule && typeof editingModule !== 'string') {
                await api.put(`/modules/${editingModule.id}`, { name, context_prompt: desc });
            }
            await fetchSystems(); // Reload to see module
            setEditingModule(null);
        } catch (err) {
            alert("Erro ao salvar módulo");
        }
    };

    const handleDeleteModule = async (id: number) => {
        if (!window.confirm("Excluir módulo?")) return;
        try {
            await api.delete(`/modules/${id}`);
            await fetchSystems();
        } catch (err) {
            alert("Erro ao excluir módulo");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
            {/* Coluna Esquerda: Lista de Sistemas */}
            <div className="col-span-1 md:col-span-4 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold text-slate-800">Sistemas</h1>
                    <button
                        onClick={() => setEditingSystem('new')}
                        className="p-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* ADD/EDIT SYSTEM FORM */}
                {editingSystem && (
                    <div className="mb-4 p-4 bg-white border border-teal-200 rounded-xl shadow-lg animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-teal-700">{editingSystem === 'new' ? 'Novo Sistema' : 'Editar Sistema'}</h3>
                            <button onClick={() => setEditingSystem(null)}><X size={16} className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSaveSystem} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome</label>
                                <input
                                    name="name"
                                    defaultValue={editingSystem !== 'new' ? editingSystem.name : ''}
                                    required className="w-full p-2 border rounded text-sm"
                                    placeholder="Ex: Gestão de Frotas"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-600 uppercase block mb-1">Contexto IA</label>
                                <textarea
                                    name="description"
                                    defaultValue={editingSystem !== 'new' ? editingSystem.description : ''}
                                    className="w-full p-2 border rounded text-sm h-16"
                                    placeholder="Descrição para ajudar a IA..."
                                />
                            </div>
                            <button className="w-full py-2 bg-teal-600 text-white rounded font-bold text-xs mt-2">Salvar Sistema</button>
                        </form>
                    </div>
                )}

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-20">
                    {systems.map(sys => (
                        <div
                            key={sys.id}
                            onClick={() => setActiveSystemId(sys.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all group relative ${activeSystemId === sys.id ? 'bg-white border-teal-500 shadow-md ring-1 ring-teal-500' : 'bg-white border-slate-200 hover:border-teal-300'}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="text-teal-600 p-2 bg-teal-50 rounded-lg">
                                    <Building size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">{sys.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sys.description}</p>
                                </div>
                            </div>

                            <div className="absolute right-2 top-2 flex gap-1 bg-white pl-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingSystem(sys); }}
                                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <Edit3 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Coluna Direita: Detalhes do Sistema */}
            <div className="hidden md:flex md:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm h-full flex-col overflow-hidden">
                {activeSystem ? (
                    <>
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-teal-600 shadow-sm">
                                        <Building size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">{activeSystem.name}</h2>
                                        <div className="flex items-start gap-2 mt-2 text-xs text-slate-500 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                                            <BrainCircuit size={14} className="text-blue-600 mt-0.5" />
                                            <div>
                                                <span className="font-bold text-blue-800 block mb-0.5">Contexto IA:</span>
                                                {activeSystem.description || 'Sem contexto definido.'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => setEditingSystem(activeSystem)} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                                        <Edit3 size={14} /> Editar
                                    </button>
                                    <button onClick={() => handleDeleteSystem(activeSystem.id)} className="p-2 text-red-600 bg-white border border-slate-200 rounded-lg hover:bg-red-50">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col p-6 bg-slate-50 overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                    <Layers size={18} /> Módulos
                                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{activeModules.length}</span>
                                </h3>
                                <button onClick={() => setEditingModule('new')} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 shadow-sm">
                                    <Plus size={16} /> Novo Módulo
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-10">
                                {/* ADD/EDIT MODULE FORM */}
                                {editingModule && (
                                    <div className="bg-white p-5 rounded-xl border border-teal-200 shadow-lg ring-4 ring-teal-500/10 animate-in slide-in-from-top-4">
                                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                            <h4 className="text-sm font-bold text-teal-700 uppercase">{editingModule === 'new' ? 'Novo Módulo' : 'Editar Módulo'}</h4>
                                            <button onClick={() => setEditingModule(null)}><X size={18} /></button>
                                        </div>
                                        <form onSubmit={handleSaveModule}>
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nome do Módulo</label>
                                                    <input
                                                        name="name"
                                                        defaultValue={editingModule !== 'new' ? editingModule.name : ''}
                                                        required className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-bold text-blue-600 uppercase mb-1.5 flex items-center gap-1.5">
                                                        <BrainCircuit size={14} /> Contexto para IA
                                                    </label>
                                                    <textarea
                                                        name="description"
                                                        defaultValue={editingModule !== 'new' ? editingModule.context_prompt : ''}
                                                        className="w-full p-3 border border-slate-200 rounded-lg text-sm h-24 resize-none"
                                                        placeholder="Descrição técnica..."
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                                                <button type="button" onClick={() => setEditingModule(null)} className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
                                                <button className="px-4 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-2"><Save size={16} /> Salvar Módulo</button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {activeModules.map(mod => (
                                    <div key={mod.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-teal-200 group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-slate-800 flex items-center gap-2 text-base">{mod.name}</h4>
                                                <p className="text-sm text-slate-500 mt-1">{mod.context_prompt || 'Sem contexto.'}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => setEditingModule(mod)} className="p-2 text-slate-400 hover:text-teal-600 rounded-lg transition-colors"><Edit3 size={18} /></button>
                                                <button onClick={() => handleDeleteModule(mod.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {activeModules.length === 0 && !editingModule && (
                                    <div className="text-center p-8 text-slate-400">
                                        <p>Nenhum módulo cadastrado neste sistema.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                        <Database size={40} className="opacity-50" />
                        <h3 className="text-lg font-medium text-slate-600 mt-2">Nenhum sistema selecionado</h3>
                        <p className="text-sm">Selecione ou crie um sistema ao lado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
