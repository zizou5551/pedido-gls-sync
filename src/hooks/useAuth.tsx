import { useState, useEffect, createContext, useContext } from 'react';

interface AuthContextType {
  usuario: string | null;
  loading: boolean;
  signIn: (usuario: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      setUsuario(savedUser);
    }
    setLoading(false);
  }, []);

  const signIn = async (usuario: string, password: string) => {
    try {
      // Verificación simple: usuario "amir" y contraseña "Fragma2025$"
      if (usuario.toLowerCase() === 'amir' && password === 'Fragma2025$') {
        setUsuario(usuario);
        localStorage.setItem('auth_user', usuario);
        return { error: null };
      } else {
        return { error: { message: 'Usuario o contraseña incorrectos' } };
      }
    } catch (error) {
      return { error: { message: 'Error de autenticación' } };
    }
  };

  const signOut = async () => {
    setUsuario(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{
      usuario,
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