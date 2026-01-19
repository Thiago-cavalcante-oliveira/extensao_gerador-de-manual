import { useEffect, useState } from 'react';
import { Search, FileJson, X } from 'lucide-react';
import { api } from '../services/api';

interface AuditLog {
    id: number;
    action: string;
    entity: string;
    user: string;
    timestamp: string;
    severity: 'info' | 'success' | 'warning' | 'critical';
    details: string | null;
}

const SeverityBadge = ({ level }: { level: string }) => {
    const config: Record<string, any> = {
        info: { color: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Info' },
        success: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Sucesso' },
        warning: { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Alerta' },
        critical: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Crítico' },
    };
    const c = config[level] || config['info'];
    return (<span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${c.color}`}>{c.label}</span>);
};

export function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    useEffect(() => {
        api.observability.auditLogs().then(data => setLogs(data));
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Logs de Auditoria</h1>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b">
                        <tr>
                            <th className="px-6 py-4">Data/Hora</th>
                            <th className="px-6 py-4">Severidade</th>
                            <th className="px-6 py-4">Ação</th>
                            <th className="px-6 py-4">Usuário</th>
                            <th className="px-6 py-4">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4"><SeverityBadge level={log.severity} /></td>
                                <td className="px-6 py-4 font-bold">{log.action}</td>
                                <td className="px-6 py-4">{log.user}</td>
                                <td className="px-6 py-4">
                                    {log.details && (
                                        <button onClick={() => setSelectedLog(log)} className="text-teal-600">
                                            <FileJson size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl">
                        <div className="flex justify-between mb-4">
                            <h3 className="font-bold text-lg">Detalhes Log #{selectedLog.id}</h3>
                            <button onClick={() => setSelectedLog(null)}><X size={20} /></button>
                        </div>
                        <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs overflow-auto max-h-96">
                            <pre>{selectedLog.details}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
