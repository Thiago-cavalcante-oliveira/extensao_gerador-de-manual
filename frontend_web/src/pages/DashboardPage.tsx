import { useEffect, useState } from 'react';
import {
    FileText, AlertTriangle, Loader2, Eye, Activity, Edit3
} from 'lucide-react';
import { api } from '../services/api';

interface Stats {
    total_manuals: number;
    weekly_growth: number;
    attention_needed: number;
    processing_count: number;
    total_views: number;
}

interface StatCardProps {
    title: string;
    value: string | number;
    subtext: string;
    icon: React.ReactNode;
    color: string;
}

const StatCard = ({ title, value, subtext, icon, color }: StatCardProps) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
            <p className="text-xs text-slate-400 mt-1">{subtext}</p>
        </div>
        <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>{icon}</div>
    </div>
);

export function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const statsData = await api.observability.stats();
                setStats(statsData);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-teal-600" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total de Manuais"
                    value={stats?.total_manuals || 0}
                    subtext="+0 nesta semana"
                    icon={<FileText size={20} className="text-teal-600" />}
                    color="bg-teal-100"
                />
                <StatCard
                    title="Atenção Necessária"
                    value={stats?.attention_needed || 0}
                    subtext="Erros / Falhas"
                    icon={<AlertTriangle size={20} className="text-orange-600" />}
                    color="bg-orange-100"
                />
                <StatCard
                    title="Em Processamento"
                    value={stats?.processing_count || 0}
                    subtext="IA trabalhando agora"
                    icon={<Loader2 size={20} className="text-blue-600 animate-spin" />}
                    color="bg-blue-100"
                />
                <StatCard
                    title="Visualizações"
                    value={stats?.total_views || 0}
                    subtext="Total acumulado"
                    icon={<Eye size={20} className="text-purple-600" />}
                    color="bg-purple-100"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Activity size={18} /> Atividade de Acesso</h3>
                    <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-sm border border-dashed border-slate-200">
                        [Gráfico de Linha: Visualizações por Dia - Em Breve]
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-4">Últimas Edições</h3>
                    <div className="space-y-4">
                        <div className="text-sm text-slate-500 italic">Nenhuma edição recente.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
