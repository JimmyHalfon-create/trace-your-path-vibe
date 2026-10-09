import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AudioPlayer from "@/components/AudioPlayer";
import { useIsAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { deleteTrace, fetchTraces, formatDate, type Trace } from "@/lib/traces";

const Admin = () => {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    fetchTraces()
      .then(setTraces)
      .catch(() => toast.error("Impossible de charger les traces"))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Shield className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/auth" replace />;

  const remove = async (t: Trace) => {
    if (!confirm("Supprimer cette trace ?")) return;
    try {
      await deleteTrace(t);
      setTraces((prev) => prev.filter((x) => x.id !== t.id));
      toast.success("Trace supprimée");
    } catch {
      toast.error("Suppression impossible");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const voiceCount = traces.filter((t) => t.trace_type === "voice").length;
  const stats = [
    { label: "Total", value: traces.length },
    { label: "Texte", value: traces.length - voiceCount },
    { label: "Vocal", value: voiceCount },
  ];

  return (
    <div className="safe-top min-h-screen bg-background px-4 pb-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Carte
          </Button>
          <h1 className="text-lg font-bold text-primary">Admin</h1>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <Card key={s.label} className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Chargement...</p>
        ) : traces.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">Aucune trace</p>
        ) : (
          traces.map((t) => (
            <Card key={t.id} className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded bg-primary/15 px-2 py-0.5 font-medium text-primary">
                    {t.trace_type === "voice" ? "Vocal" : "Texte"}
                  </span>
                  <span className="text-muted-foreground">{formatDate(t.created_at)}</span>
                </div>
                {t.trace_type === "voice" && t.audio_url ? (
                  <AudioPlayer src={t.audio_url} />
                ) : (
                  <p className="break-words text-foreground">{t.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t.latitude.toFixed(4)}, {t.longitude.toFixed(4)}
                </p>
              </div>
              <Button variant="destructive" size="icon" onClick={() => remove(t)} aria-label="Supprimer">
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Admin;
