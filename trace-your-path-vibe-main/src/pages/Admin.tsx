import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, ArrowLeft, Shield, AlertTriangle } from "lucide-react";
import AudioPlayer from "@/components/AudioPlayer";

interface Trace {
  id: string;
  message: string;
  latitude: number;
  longitude: number;
  created_at: string;
  trace_type: 'text' | 'voice';
  audio_url?: string;
}

const Admin = () => {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/');
          return;
        }

        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Error checking admin status:', error);
          navigate('/');
          return;
        }

        if (!roleData) {
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas les permissions administrateur",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error in admin check:', error);
        navigate('/');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAdminStatus();
  }, [navigate, toast]);

  // Charger toutes les traces
  useEffect(() => {
    if (!isAdmin) return;

    const loadTraces = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("traces")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTraces((data || []) as Trace[]);
      } catch (error) {
        console.error("Error loading traces:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les traces",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTraces();
  }, [isAdmin, toast]);

  const deleteTrace = async (traceId: string) => {
    try {
      const { error } = await supabase
        .from('traces')
        .delete()
        .eq('id', traceId);

      if (error) throw error;

      setTraces(traces.filter(t => t.id !== traceId));
      
      toast({
        title: "Trace supprimée",
        description: "La trace a été supprimée avec succès",
      });
    } catch (error) {
      console.error('Error deleting trace:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la trace",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Backoffice Admin</h1>
                <p className="text-sm text-muted-foreground">Modération des traces</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{traces.length}</p>
              <p className="text-sm text-muted-foreground">Traces totales</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {traces.filter(t => t.trace_type === 'text').length}
              </p>
              <p className="text-sm text-muted-foreground">Traces texte</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {traces.filter(t => t.trace_type === 'voice').length}
              </p>
              <p className="text-sm text-muted-foreground">Traces vocales</p>
            </div>
          </Card>
        </div>

        {/* Liste des traces */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Toutes les traces
          </h2>
          
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : traces.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune trace pour le moment
            </div>
          ) : (
            <div className="space-y-4">
              {traces.map((trace) => (
                <Card key={trace.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trace.trace_type === 'voice' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {trace.trace_type === 'voice' ? 'Vocal' : 'Texte'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(trace.created_at)}
                        </span>
                      </div>
                      
                      {trace.trace_type === 'text' ? (
                        <p className="text-foreground">{trace.message}</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">{trace.message}</p>
                          {trace.audio_url && (
                            <AudioPlayer audioUrl={trace.audio_url} />
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Position: {trace.latitude.toFixed(4)}, {trace.longitude.toFixed(4)}
                      </div>
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTrace(trace.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Admin;
