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
    const sessionTimestamp = localStorage.getItem('auth_timestamp');
    
    if (savedUser && sessionTimestamp) {
      const now = Date.now();
      const sessionTime = parseInt(sessionTimestamp);
      const sessionDuration = 60 * 60 * 1000; // 1 hora en milisegundos
      
      if (now - sessionTime < sessionDuration) {
        setUsuario(savedUser);
      } else {
        // Sesión expirada, limpiar
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_timestamp');
      }
    }
    setLoading(false);
  }, []);

  // Verificar sesión cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      const savedUser = localStorage.getItem('auth_user');
      const sessionTimestamp = localStorage.getItem('auth_timestamp');
      
      if (savedUser && sessionTimestamp) {
        const now = Date.now();
        const sessionTime = parseInt(sessionTimestamp);
        const sessionDuration = 60 * 60 * 1000; // 1 hora
        
        if (now - sessionTime >= sessionDuration) {
          // Sesión expirada, cerrar sesión automáticamente
          setUsuario(null);
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_timestamp');
          window.location.reload(); // Actualizar página automáticamente
        }
      }
    }, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, []);

  const signIn = async (usuario: string, password: string) => {
    try {
      // Verificación simple: usuario "amir" y contraseña "Fragma2025$"
      if (usuario.toLowerCase() === 'amir' && password === 'Fragma2025$') {
        setUsuario(usuario);
        localStorage.setItem('auth_user', usuario);
        localStorage.setItem('auth_timestamp', Date.now().toString());
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
    localStorage.removeItem('auth_timestamp');
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