import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';


interface AppConfig {
    primary_color: string;
    secondary_color: string;
    logo_url: string;
    blur_intensity: number;
    mask_style: string;
    privacy_default_enabled: boolean;
}

const defaultConfig: AppConfig = {
    primary_color: '#0099ff',
    secondary_color: '#2b8a3e',
    logo_url: '',
    blur_intensity: 6,
    mask_style: 'dots',
    privacy_default_enabled: false
};

interface ConfigurationContextType {
    config: AppConfig;
    loading: boolean;
    refreshConfig: () => Promise<void>;
}

const ConfigurationContext = createContext<ConfigurationContextType | undefined>(undefined);

export function ConfigurationProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<AppConfig>(defaultConfig);
    const [loading, setLoading] = useState(true);

    const refreshConfig = async () => {
        try {
            const data = await api.configuration.get();
            if (data) {
                setConfig(data);
            }
        } catch (error) {
            console.error("Failed to load global config:", error);
            // Silent fail, use defaults
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshConfig();
    }, []);

    return (
        <ConfigurationContext.Provider value={{ config, loading, refreshConfig }}>
            {children}
        </ConfigurationContext.Provider>
    );
}

export function useConfiguration() {
    const context = useContext(ConfigurationContext);
    if (context === undefined) {
        throw new Error('useConfiguration must be used within a ConfigurationProvider');
    }
    return context;
}
