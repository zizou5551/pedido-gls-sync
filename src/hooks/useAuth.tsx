import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: { usuario: string } | null;
  loading: boolean;
  signIn: (usuario: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ usuario: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión guardada
    const savedUser = localStorage.getItem('authenticated_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (usuario: string, password: string) => {
    try {
      // Verificar credenciales en la base de datos
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', usuario.toLowerCase())
        .single();

      if (error || !data) {
        return { error: { message: 'Usuario no encontrado' } };
      }

      // Verificar contraseña usando la función de PostgreSQL
      const { data: passwordCheck, error: passwordError } = await supabase
        .rpc('verify_password', {
          input_password: password,
          stored_hash: data.password_hash
        });

      if (passwordError) {
        console.error('Error verificando contraseña:', passwordError);
        return { error: { message: 'Error de autenticación' } };
      }

      if (!passwordCheck) {
        return { error: { message: 'Contraseña incorrecta' } };
      }

      // Login exitoso
      const userData = { usuario: data.usuario };
      setUser(userData);
      localStorage.setItem('authenticated_user', JSON.stringify(userData));
      
      return { error: null };
    } catch (error) {
      console.error('Error en signIn:', error);
      return { error: { message: 'Error de conexión' } };
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('authenticated_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut,
    }}>
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