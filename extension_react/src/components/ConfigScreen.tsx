import { useState } from 'react';
import {
    Building, Package,
    User, Lock, ChevronDown, Eye, ShieldAlert,
    Type, Users, CheckCircle2, Circle,
    Monitor, Layout, Wand2, Plus, X, Disc
} from 'lucide-react';

export const ConfigScreen = ({
    systems, filteredModules,
    selectedSystem, setSelectedSystem,
    selectedModule, setSelectedModule,
    chapterName, setChapterName,
    audience, setAudience,
    mode, setMode,
    captureSource, setCaptureSource,
    privacyMode, setPrivacyMode,
    activeTool, setActiveTool,
    loading, error,
    onStart
}: any) => {

    // Audience Logic
    const [isAudienceOpen, setIsAudienceOpen] = useState(false);
    const [newAudience, setNewAudience] = useState('');
    const [availableAudiences, setAvailableAudiences] = useState(['Médico', 'Enfermeiro', 'Administrativo', 'Cidadão']);

    const toggleAudience = (aud: string) => {
        if (audience.includes(aud)) {
            setAudience(audience.filter((a: string) => a !== aud));
        } else {
            setAudience([...audience, aud]);
        }
    };

    const handleAddAudience = () => {
        if (newAudience && !availableAudiences.includes(newAudience)) {
            setAvailableAudiences([...availableAudiences, newAudience]);
            setAudience([...audience, newAudience]);
            setNewAudience('');
        }
    }

    return (
        <div className="flex flex-col gap-0 bg-slate-50 min-h-[500px] font-sans text-slate-800 relative h-full">

            {/* 1. HEADER */}
            <div className="bg-white px-4 py-3 border-b border-slate-200 shadow-sm z-10">
                <div className="flex justify-between items-center h-10">
                    <div className="flex items-center gap-3">
                        <img
                            src="logo_foz_iguacu.png"
                            alt="Brasão"
                            className="h-10 w-auto object-contain"
                        />
                        <div className="flex flex-col justify-center h-full border-l border-slate-200 pl-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
                                Prefeitura de
                            </span>
                            <span className="text-sm font-extrabold text-slate-800 leading-none">
                                Foz do Iguaçu
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end justify-center h-full">
                        <span className="font-bold text-teal-700 tracking-tight text-base leading-none mb-1">
                            FozDocs
                        </span>
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded text-[9px] text-slate-500 font-medium border border-slate-200 leading-none">
                            <User size={8} />
                            Dev Admin
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto pb-20">
                {/* Error Message */}
                {error && (
                    <div className="p-2 bg-red-100 text-red-700 text-xs rounded border border-red-200">
                        {error}
                    </div>
                )}

                {/* Context Mode */}
                <div className="flex p-1 bg-slate-200 rounded-lg shrink-0">
                    <button
                        onClick={() => setMode('new')}
                        className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${mode === 'new'
                            ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Novo Guia
                    </button>
                    <button
                        onClick={() => setMode('append')}
                        className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${mode === 'append'
                            ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Add Capítulo
                    </button>
                </div>

                {/* Fonte de Captura */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setCaptureSource('tab')}
                        className={`flex flex-col items-center gap-2 p-3 border rounded-lg transition-all ${captureSource === 'tab'
                            ? 'bg-teal-50 border-teal-500 text-teal-800 ring-1 ring-teal-500'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                    >
                        <Layout size={20} />
                        <span className="text-xs font-bold">Esta Guia</span>
                    </button>

                    <button
                        onClick={() => setCaptureSource('window')}
                        className={`flex flex-col items-center gap-2 p-3 border rounded-lg transition-all ${captureSource === 'window'
                            ? 'bg-teal-50 border-teal-500 text-teal-800 ring-1 ring-teal-500'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                    >
                        <Monitor size={20} />
                        <span className="text-xs font-bold">Escolher Janela</span>
                    </button>
                </div>

                {/* Form Area */}
                <div className="flex flex-col gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                            <Building size={12} /> Sistema
                        </label>
                        <div className="relative">
                            <select
                                value={selectedSystem}
                                onChange={(e) => setSelectedSystem(e.target.value)}
                                className="w-full pl-3 pr-8 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 appearance-none text-slate-700 shadow-sm"
                            >
                                <option value="">Selecione...</option>
                                {systems.map((sys: any) => <option key={sys.id} value={sys.id}>{sys.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                            <Package size={12} /> Módulo
                        </label>
                        <div className="relative">
                            <select
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                                disabled={!selectedSystem}
                                className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none appearance-none text-slate-700 shadow-sm disabled:text-slate-400 disabled:cursor-not-allowed"
                            >
                                <option value="">Selecione...</option>
                                {filteredModules.map((mod: any) => <option key={mod.id} value={mod.id}>{mod.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="border-t border-dashed border-slate-200 my-1"></div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-teal-700 uppercase flex items-center gap-1.5">
                            <Type size={12} /> Ação (Nome do Capítulo)
                        </label>
                        <input
                            type="text"
                            value={chapterName}
                            onChange={(e) => setChapterName(e.target.value)}
                            placeholder="Ex: Como cancelar nota fiscal"
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400 shadow-sm"
                        />
                    </div>

                    {/* --- TARGET AUDIENCE (MULTI-SELECT) --- */}
                    <div className="flex flex-col gap-1 relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                            <Users size={12} /> Público Alvo
                        </label>

                        <div
                            className="w-full min-h-[38px] px-2 py-1.5 bg-white border border-slate-300 rounded-md focus-within:ring-1 focus-within:ring-teal-500 shadow-sm cursor-pointer flex flex-wrap gap-1 items-center"
                            onClick={() => setIsAudienceOpen(!isAudienceOpen)}
                        >
                            {audience.length === 0 && <span className="text-sm text-slate-400">Selecione...</span>}
                            {audience.map((aud: string) => (
                                <span key={aud} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal-100 text-teal-800 text-xs rounded border border-teal-200">
                                    {aud}
                                    <X size={10} className="cursor-pointer hover:text-teal-900" onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAudience(aud);
                                    }} />
                                </span>
                            ))}
                            <ChevronDown size={14} className="ml-auto text-slate-400" />
                        </div>

                        {isAudienceOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsAudienceOpen(false)}
                                ></div>
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 p-2 max-h-48 overflow-y-auto">
                                    {availableAudiences.map((aud) => (
                                        <div
                                            key={aud}
                                            className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer text-sm"
                                            onClick={() => toggleAudience(aud)}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${audience.includes(aud) ? 'bg-teal-600 border-teal-600' : 'border-slate-300'}`}>
                                                {audience.includes(aud) && <CheckCircle2 size={10} className="text-white" />}
                                            </div>
                                            <span>{aud}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-slate-100 mt-2 pt-2 flex gap-2">
                                        <input
                                            className="flex-1 text-xs px-2 py-1 border rounded"
                                            placeholder="Novo público (Enter)..."
                                            value={newAudience}
                                            onChange={(e) => setNewAudience(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddAudience();
                                                }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <button
                                            className="text-white bg-slate-800 p-1 rounded hover:bg-black"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddAudience();
                                            }}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. LGPD CARD */}
                <div
                    className={`flex flex-col p-0 border rounded-lg shadow-sm overflow-hidden transition-all duration-300 ${privacyMode ? 'border-blue-500 ring-1 ring-blue-100 bg-blue-50/50' : 'border-slate-200 bg-white'
                        }`}
                >
                    {/* Header Toggle */}
                    <div className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-50" onClick={() => setPrivacyMode(!privacyMode)}>
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <ShieldAlert size={16} className={privacyMode ? "text-blue-600" : "text-slate-400"} />
                                <span className={`text-sm font-bold ${privacyMode ? "text-blue-800" : "text-slate-700"}`}>
                                    Modo Privacidade
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight w-48">
                                {privacyMode
                                    ? "Ativo. Selecione a ferramenta abaixo."
                                    : "Ative para proteger dados sensíveis."
                                }
                            </p>
                        </div>

                        <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${privacyMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ease-in-out ${privacyMode ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {/* Área de Seleção */}
                    {privacyMode && (
                        <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2">
                            <div className="mt-2 pt-2 border-t border-blue-200/50">
                                <label className="text-[10px] font-bold text-blue-800 uppercase mb-2 block">
                                    Escolha a ferramenta ativa:
                                </label>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => setActiveTool('mask')}
                                        className={`flex items-center gap-3 p-2 rounded-md border text-left transition-all ${activeTool === 'mask'
                                            ? 'bg-blue-100 border-blue-500 text-blue-900 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className={`p-1 rounded-full ${activeTool === 'mask' ? 'text-blue-600' : 'text-slate-300'}`}>
                                            {activeTool === 'mask' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold flex items-center gap-1">
                                                <Lock size={10} /> Mascarar Inputs
                                            </span>
                                            <span className="text-[10px] opacity-80">Transforma textos em bolinhas (••••).</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setActiveTool('blur')}
                                        className={`flex items-center gap-3 p-2 rounded-md border text-left transition-all ${activeTool === 'blur'
                                            ? 'bg-blue-100 border-blue-500 text-blue-900 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className={`p-1 rounded-full ${activeTool === 'blur' ? 'text-blue-600' : 'text-slate-300'}`}>
                                            {activeTool === 'blur' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold flex items-center gap-1">
                                                <Wand2 size={10} /> Borrar Textos
                                            </span>
                                            <span className="text-[10px] opacity-80">Torna textos estáticos ilegíveis.</span>
                                        </div>
                                    </button>
                                </div>

                                <div className="mt-3 flex items-center gap-2 px-2 py-1.5 bg-blue-100/30 rounded text-blue-700 border border-blue-100">
                                    <Eye size={12} />
                                    <span className="text-sm font-bold leading-tight">
                                        Segure ALT para pausar e espiar.
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER FIXO - MOVED OUTSIDE THE SCROLLABLE AREA BUT INSIDE THE CONTAINER */}
            <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-200 p-3 shadow-lg z-20">
                <button
                    onClick={onStart}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] border border-red-800/20 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="p-1 bg-white/20 rounded-full group-hover:animate-pulse">
                        <Disc size={18} fill="currentColor" className="opacity-100" />
                    </div>
                    {/* Fixed the 'status' usage here by assuming 'INICIAR GRAVAÇÃO' is default since ConfigScreen is only shown when idle */}
                    INICIAR GRAVAÇÃO
                </button>
            </div>
        </div>
    );
}
