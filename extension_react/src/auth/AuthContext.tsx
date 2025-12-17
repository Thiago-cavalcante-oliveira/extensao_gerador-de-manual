import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export enum UserRole {
    ADMIN = 'admin',
    PRODUCER = 'producer',
    READER = 'reader',
}

interface User {
    id: string; // Mock ID usually '1', '2', '3'
    email: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    login: (role: UserRole) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Restaurar sessão do storage
        const stored = localStorage.getItem('fozdocs_user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
    }, []);

    const login = (role: UserRole) => {
        // Mock Logic: Mapeia role para um usuário pré-definido no seed
        let mockUser: User;
        switch (role) {
            case UserRole.ADMIN:
                mockUser = { id: '1', email: 'admin@fozdocs.local', role };
                break;
            case UserRole.PRODUCER:
                mockUser = { id: '2', email: 'produtor@fozdocs.local', role };
                break;
            default:
                mockUser = { id: '3', email: 'leitor@fozdocs.local', role: UserRole.READER };
        }

        setUser(mockUser);
        localStorage.setItem('fozdocs_user', JSON.stringify(mockUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('fozdocs_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
