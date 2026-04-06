import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, Package2, Truck, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (user) {
    navigate('/');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await signIn(email, password);

    if (error) {
      setError('Email o contraseña incorrectos. Por favor, inténtalo de nuevo.');
      toast({ variant: "destructive", title: "Error de acceso", description: error.message });
    } else {
      toast({ title: "¡Bienvenido!", description: "Acceso correcto" });
      navigate('/');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg mb-4">
            <Package2 className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Seguimiento de Pedidos</h1>
          <p className="text-slate-400 mt-1 text-sm">AMIR Educación</p>
        </div>

        {/* Login card */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4 pt-6 px-8">
            <h2 className="text-lg font-bold text-slate-800">Acceder a tu cuenta</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Introduce tus credenciales para ver el estado de tus pedidos
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11 font-semibold text-base shadow-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accediendo...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>

            {/* Features hint */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
              {[
                { icon: <CheckCircle2 className="h-3.5 w-3.5 text-red-500" />, text: "Pedidos entregados en rojo" },
                { icon: <Truck className="h-3.5 w-3.5 text-green-500" />, text: "Envíos en tránsito en verde" },
                { icon: <Package2 className="h-3.5 w-3.5 text-yellow-500" />, text: "Pedidos pendientes en amarillo" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                  {item.icon}
                  {item.text}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          Sistema de gestión de envíos · AMIR Educación
        </p>
      </div>
    </div>
  );
};

export default Auth;
