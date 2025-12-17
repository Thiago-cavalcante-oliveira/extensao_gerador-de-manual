import { useState } from 'react';
import { Container } from '@mantine/core';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginScreen } from './auth/LoginScreen';
import { Dashboard } from './dashboard/Dashboard';
import { RecorderControls } from './recorder/RecorderControls';

function Main() {
    const { user } = useAuth();
    const [view, setView] = useState<'dashboard' | 'recorder'>('dashboard');
    const [selection, setSelection] = useState<{ sys: string, mod: string } | null>(null);

    if (!user) {
        return <LoginScreen />;
    }

    const handleModuleSelect = (sys: string, mod: string) => {
        setSelection({ sys, mod });
        setView('recorder');
    };

    const handleCancelRecorder = () => {
        setView('dashboard');
        setSelection(null);
    };

    return (
        <Container p={0}>
            {view === 'dashboard' && <Dashboard onModuleSelect={handleModuleSelect} />}
            {view === 'recorder' && selection && (
                <RecorderControls
                    systemId={selection.sys}
                    moduleId={selection.mod}
                    onCancel={handleCancelRecorder}
                />
            )}
        </Container>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Main />
        </AuthProvider>
    );
}
