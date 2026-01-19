import {
    LayoutDashboard, FileText, Building, Users, Shield,
    BarChart3, Settings, LogOut, Menu
} from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
    isOpen: boolean;
    onCloseMobile: () => void;
}

export function Sidebar({ isOpen, onCloseMobile }: SidebarProps) {
    const activeClass = "bg-teal-50 text-teal-700 shadow-sm border border-teal-100";
    const inactiveClass = "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

    const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
        <NavLink
            to={to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200 whitespace-nowrap overflow-hidden ${isActive ? activeClass : inactiveClass}`
            }
        >
            <span className="shrink-0">{icon}</span>
            {label}
        </NavLink>
    );

    return (
        <>
            <aside className={`fixed md:relative z-20 h-full bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden'}`}>
                <div className="p-4 flex flex-col gap-1 overflow-y-auto flex-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2 px-3 whitespace-nowrap">Gestão</div>
                    <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
                    <NavItem to="/library" icon={<FileText size={18} />} label="Biblioteca (Viewer)" />
                    <NavItem to="/videos" icon={<FileText size={18} />} label="Gestão de Tutoriais" />
                    <NavItem to="/systems" icon={<Building size={18} />} label="Sistemas & Módulos" />

                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-3 whitespace-nowrap">Administração</div>
                    <NavItem to="/users" icon={<Users size={18} />} label="Usuários" />
                    <NavItem to="/audit" icon={<Shield size={18} />} label="Auditoria & Logs" />
                    <NavItem to="/analytics" icon={<BarChart3 size={18} />} label="Analytics" />

                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-3 whitespace-nowrap">Sistema</div>
                    <NavItem to="/design" icon={<Settings size={18} />} label="Configurações" />
                </div>

                <div className="p-4 border-t border-slate-100">
                    <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 w-full transition-colors whitespace-nowrap">
                        <LogOut size={18} /> Sair
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-10 md:hidden top-16"
                    onClick={onCloseMobile}
                ></div>
            )}
        </>
    );
}
