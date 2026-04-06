import { useAuth } from "@/hooks/useAuth";
import { OrderStatus } from "@/components/OrderStatus";
import { Button } from "@/components/ui/button";
import { LogOut, Package2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { usuario, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente" });
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <Package2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground leading-tight text-base">
                Seguimiento de Pedidos
              </h1>
              <p className="text-xs text-muted-foreground">AMIR Educación</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {usuario && (
              <span className="text-xs text-muted-foreground hidden sm:block">{usuario}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <OrderStatus />
      </main>
    </div>
  );
};

export default Index;
