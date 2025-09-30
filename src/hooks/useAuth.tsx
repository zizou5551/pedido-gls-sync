import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Define the authentication context type
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<{ error?: any }>;
  // Keep usuario for backward compatibility
  usuario: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Auto logout after 10 minutes of inactivity
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    
    if (user) {
      const timer = setTimeout(async () => {
        console.log('Auto logout due to inactivity');
        await signOut();
      }, INACTIVITY_TIMEOUT);
      
      setInactivityTimer(timer);
    }
  };

  // Set up activity listeners
  useEffect(() => {
    if (!user) {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        setInactivityTimer(null);
      }
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimer = () => {
      resetInactivityTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Start the timer
    resetInactivityTimer();

    return () => {
      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
      
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [user, inactivityTimer]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Auto-assign roles based on email domain
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            try {
              const userEmail = session.user.email || '';
              let roleToAssign: 'admin' | 'staff' | 'viewer' = 'staff'; // Default role
              
              // Check if user is from admin domains
              if (userEmail.endsWith('@fragma.es') || userEmail.endsWith('@amireducacion.com')) {
                roleToAssign = 'admin';
              } else {
                // Check if this is the first user ever (make them admin)
                const { data: existingRoles } = await supabase
                  .from('user_roles')
                  .select('*')
                  .limit(1);
                
                if (!existingRoles || existingRoles.length === 0) {
                  roleToAssign = 'admin';
                }
              }
              
              // Check if user already has a role
              const { data: userRole } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              // Only assign role if user doesn't have one
              if (!userRole) {
                await supabase
                  .from('user_roles')
                  .insert({ user_id: session.user.id, role: roleToAssign });
              }
            } catch (error) {
              console.log('Error assigning role:', error);
            }
          }, 1000);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    // Backward compatibility
    usuario: user?.email || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};