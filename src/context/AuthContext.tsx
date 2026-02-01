
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkWhitelist = async (currentUser: User) => {
        if (!currentUser.email) return false;

        try {
            const { data, error } = await supabase
                .from('allowed_users')
                .select('email')
                .eq('email', currentUser.email)
                .single();

            if (error || !data) {
                console.warn("User not in whitelist:", currentUser.email);
                return false;
            }
            return true;
        } catch (err) {
            console.error("Error checking whitelist:", err);
            return false;
        }
    };

    const handleSession = async (currentSession: Session | null) => {
        if (currentSession?.user) {
            const isAllowed = await checkWhitelist(currentSession.user);
            if (isAllowed) {
                setSession(currentSession);
                setUser(currentSession.user);
            } else {
                await supabase.auth.signOut();
                setSession(null);
                setUser(null);
                alert("Acesso Restrito: Seu e-mail não está autorizado.");
                window.location.href = '/login'; // Force redirect
            }
        } else {
            setSession(null);
            setUser(null);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleSession(session);
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // Optimistic check to avoid flicker if just logging out
            if (!session) {
                setSession(null);
                setUser(null);
                setIsLoading(false);
            } else {
                // Re-verify on every auth change (login, token refresh)
                handleSession(session);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error("Error signing in with Google:", error);
            alert("Erro ao fazer login com Google.");
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, isLoading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
