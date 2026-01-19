import { useState } from 'react';
import {
    Building, Package,
    ChevronDown, ShieldAlert,
    Type, Users, CheckCircle2,
    Monitor, Layout, X, Disc,
    AlertCircle
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
    loading, error,
    onStart,
    appConfig
}: any) => {

    // Audience Logic
    const [isAudienceOpen, setIsAudienceOpen] = useState(false);
    const [availableAudiences, setAvailableAudiences] = useState(['Médico', 'Enfermeiro', 'Administrativo', 'Cidadão']);
    const [newAudience, setNewAudience] = useState('');

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
    };

    const logoSrc = appConfig?.logo_url || (chrome?.runtime?.getURL ? chrome.runtime.getURL('logo_foz_iguacu.png') : 'logo_foz_iguacu.png');

    return (
        <div className="flex flex-col h-full bg-slate-50 font-sans text-slate-800 overflow-hidden">

            {/* 1. FLEX HEADER */}
            <div className="bg-white px-4 py-3 border-b border-slate-200 shadow-sm shrink-0 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src={logoSrc} alt="Brasão" className="h-8 w-auto object-contain" />
                    <div className="flex flex-col justify-center border-l border-slate-200 pl-2">
                        <span className="text-xs font-extrabold text-slate-800 leading-none">Foz do Iguaçu</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">FozDocs Admin</span>
                    </div>
                </div>
            </div>

            {/* 2. SCROLLABLE CONTENT (Takes remaining space) */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 p-3 flex flex-col gap-3">

                {/* Error Message */}
                {error && (
                    <div className="p-2 bg-red-100 text-red-700 text-xs rounded border border-red-200 shrink-0">
                        {error}
                    </div>
                )}

                {/* Top Controls Row */}
                <div className="flex gap-2 shrink-0">
                    <div className="flex flex-1 p-0.5 bg-slate-200 rounded-lg">
                        <button onClick={() => setMode('new')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${mode === 'new' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Novo Guia</button>
                        <button onClick={() => setMode('append')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${mode === 'append' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Add Cap.</button>
                    </div>
                    <div className="flex flex-1 p-0.5 bg-slate-200 rounded-lg">
                        <button onClick={() => setCaptureSource('tab')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-all flex items-center justify-center gap-1 ${captureSource === 'tab' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500'}`}><Layout size={12} /> Guia</button>
                        <button onClick={() => setCaptureSource('window')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-all flex items-center justify-center gap-1 ${captureSource === 'window' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500'}`}><Monitor size={12} /> Janela</button>
                    </div>
                </div>

                {/* Main Form Card */}
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-3 flex flex-col gap-3 shrink-0">

                    <div className="grid grid-cols-1 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-1"><Building size={12} /> Sistema</label>
                            <div className="relative">
                                <select value={selectedSystem} onChange={(e) => setSelectedSystem(Number(e.target.value))} className="w-full pl-2 pr-6 py-2 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 appearance-none shadow-sm">
                                    <option value="">Selecione...</option>
                                    {systems.map((sys: any) => <option key={sys.id} value={sys.id}>{sys.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-1"><Package size={12} /> Módulo</label>
                            <div className="relative">
                                <select value={selectedModule} onChange={(e) => setSelectedModule(Number(e.target.value))} disabled={!selectedSystem} className="w-full pl-2 pr-6 py-2 text-xs bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-teal-500 appearance-none shadow-sm disabled:opacity-50">
                                    <option value="">Selecione...</option>
                                    {filteredModules.map((mod: any) => <option key={mod.id} value={mod.id}>{mod.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-teal-700 uppercase flex items-center gap-1.5 mb-1"><Type size={12} /> Nome do Capítulo</label>
                        <input type="text" value={chapterName} onChange={(e) => setChapterName(e.target.value)} placeholder="Ex: Cancelar Nota" className="w-full px-2 py-2 text-xs border border-slate-300 rounded shadow-sm focus:ring-1 focus:ring-teal-500" />
                    </div>

                    <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-1"><Users size={12} /> Público</label>
                        <div className="w-full min-h-[34px] px-2 py-1.5 bg-white border border-slate-300 rounded cursor-pointer flex flex-wrap gap-1 items-center" onClick={() => setIsAudienceOpen(!isAudienceOpen)}>
                            {audience.length === 0 && <span className="text-xs text-slate-400">Todos...</span>}
                            {audience.map((aud: string) => (
                                <span key={aud} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal-50 text-teal-700 text-[10px] rounded border border-teal-100 font-medium">
                                    {aud} <X size={10} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleAudience(aud); }} />
                                </span>
                            ))}
                            <ChevronDown size={14} className="ml-auto text-slate-400" />
                        </div>
                        {isAudienceOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsAudienceOpen(false)}></div>
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded shadow-xl z-50 p-2 max-h-40 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex gap-1 mb-2">
                                        <input
                                            type="text"
                                            value={newAudience}
                                            onChange={(e) => setNewAudience(e.target.value)}
                                            placeholder="Novo público..."
                                            className="flex-1 px-1.5 py-1 text-[10px] border border-slate-300 rounded"
                                        />
                                        <button type="button" onClick={handleAddAudience} className="px-2 py-1 bg-teal-600 text-white rounded text-[10px] font-bold hover:bg-teal-700">+</button>
                                    </div>
                                    {availableAudiences.map((aud) => (
                                        <div key={aud} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer text-xs" onClick={() => toggleAudience(aud)}>
                                            <div className={`w-3 h-3 rounded border flex items-center justify-center ${audience.includes(aud) ? 'bg-teal-600 border-teal-600' : 'border-slate-300'}`}>
                                                {audience.includes(aud) && <CheckCircle2 size={8} className="text-white" />}
                                            </div>
                                            <span>{aud}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Privacy Toggle */}
                <div className={`flex flex-col border rounded-lg transition-all shrink-0 ${privacyMode ? 'border-teal-500 bg-teal-50/30' : 'border-slate-200 bg-white'}`}>
                    <div className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-50" onClick={() => setPrivacyMode(!privacyMode)}>
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={16} className={privacyMode ? "text-teal-600" : "text-slate-400"} />
                            <div className="flex flex-col">
                                <span className={`text-xs font-bold ${privacyMode ? "text-teal-800" : "text-slate-600"}`}>Modo Privacidade</span>
                            </div>
                        </div>
                        <div className={`relative w-8 h-4 rounded-full transition-colors ${privacyMode ? 'bg-teal-600' : 'bg-slate-300'}`}>
                            <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full shadow transition-transform ${privacyMode ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {privacyMode && (
                        <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-1">
                            <div className="mb-2 p-2 bg-yellow-50 text-yellow-800 text-[10px] rounded border border-yellow-100 flex gap-2">
                                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                                <span>A gravação iniciará em modo de <b>preparação</b> para você selecionar o que proteger.</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Padding bottom to ensure content isn't flush with footer if scrolled */}
                <div className="h-2"></div>
            </div>

            {/* Footer - FLEX ITEM (Sticky like) */}
            <div className="bg-white border-t border-slate-200 p-3 shadow-lg shrink-0 z-20 flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="font-bold text-slate-600">DICA:</span> Use <kbd className="bg-white px-1 rounded border border-slate-200 font-mono text-slate-500">ALT</kbd> para pausar a gravação.
                </div>
                <button onClick={onStart} disabled={loading} className={`w-full flex items-center justify-center gap-2 text-white py-3 rounded-lg font-bold text-sm shadow transition-all active:scale-[0.98] disabled:opacity-50 ${privacyMode ? 'bg-teal-600 hover:bg-teal-700' : 'bg-red-600 hover:bg-red-700'}`}>
                    <div className="p-1 bg-white/20 rounded-full">
                        {privacyMode ? <ShieldAlert size={16} fill="currentColor" /> : <Disc size={16} fill="currentColor" />}
                    </div>
                    {privacyMode ? "APLICAR PRIVACIDADE & GRAVAR" : "INICIAR GRAVAÇÃO"}
                </button>
            </div>
        </div>
    );
}
