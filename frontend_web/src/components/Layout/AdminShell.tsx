import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function AdminShell({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-16 flex items-center shadow-sm shrink-0">
                <div className="w-full px-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        {/* <img src="/logo_foz_iguacu.png" className="h-8 w-auto" alt="Logo" /> */}
                        <div className="h-8 w-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">FZ</div>
                        <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                        <span className="text-lg font-bold text-teal-700 tracking-tight hidden sm:block">
                            FozDocs <span className="text-slate-400 font-medium text-sm">Admin</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 max-sm:hidden">
                            <span className="text-xs font-bold text-slate-500 uppercase">Ambiente:</span>
                            <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs font-bold border border-teal-100">
                                Prefeitura Municipal
                            </span>
                        </div>
                        <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold border border-slate-300 cursor-pointer hover:ring-2 ring-teal-500 transition-all">
                            TH
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar isOpen={isSidebarOpen} onCloseMobile={() => setIsSidebarOpen(false)} />

                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-slate-50 scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    );
}
