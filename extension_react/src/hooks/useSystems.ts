import { useState, useEffect } from 'react';

interface System {
    id: number;
    name: string;
}

interface Module {
    id: number;
    system_id: number;
    name: string;
}

export function useSystems() {
    const [systems, setSystems] = useState<System[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const sysRes = await fetch('http://localhost:8000/api/v1/systems');
                if (!sysRes.ok) throw new Error('Failed to fetch systems');
                const sysData = await sysRes.json();
                setSystems(sysData);

                const modRes = await fetch('http://localhost:8000/api/v1/systems/modules/all');
                if (modRes.ok) {
                    const modData = await modRes.json();
                    setModules(modData);
                } else {
                    // Fallback mock
                    setModules([
                        { id: 1, system_id: 1, name: 'Triagem' },
                        { id: 2, system_id: 1, name: 'Farmácia' }
                    ]);
                }

            } catch (err) {
                console.error(err);
                setError('Erro ao carregar dados. Backend offline?');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    return { systems, modules, loading, error };
}
