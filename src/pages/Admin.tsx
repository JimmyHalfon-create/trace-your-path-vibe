import TagView from "@/components/TagView";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, LogOut, Shield, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AudioPlayer from "@/components/AudioPlayer";
import { useIsAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { deleteTrace, fetchAdminTraces, formatDate, moderatePendingTraces, type AdminTrace as Trace } from "@/lib/traces";

const Admin = () => {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const load = () => fetchAdminTraces().then(setTraces);
    load()
      .catch(() => toast.error("Impossible de charger les traces"))
      .finally(() => setLoading(false));
    setAnalysing(true);
    moderatePendingTraces()
      .then((n) => (n > 0 ? load() : undefined))
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setAnalysing(false));
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
  const tagCount = traces.filter((t) => t.trace_type === "tag").length;
  const flaggedCount = traces.filter((t) => t.moderation_flag).length;
  const stats = [
    { label: "Total", value: traces.length },
    { label: "Texte", value: traces.length - voiceCount - tagCount },
    { label: "Tag", value: tagCount },
    { label: "Vocal", value: voiceCount },
    { label: "Signalées", value: flaggedCount },
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

        <div className="grid grid-cols-5 gap-2">
          {stats.map((s) => (
            <Card key={s.label} className="p-3 text-center">
              <p className={`text-2xl font-bold ${s.label === "Signalées" && s.value ? "text-destructive" : "text-primary"}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        {analysing && (
          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" /> Analyse IA des nouvelles traces…
          </p>
        )}

        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Chargement...</p>
        ) : traces.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">Aucune trace</p>
        ) : (
          traces.map((t) => (
            <Card key={t.id} className={`flex items-start gap-3 p-4 ${t.moderation_flag ? "border-destructive/60 bg-destructive/5" : ""}`}>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded bg-primary/15 px-2 py-0.5 font-medium text-primary">
                    {t.trace_type === "voice" ? "Vocal" : t.trace_type === "tag" ? "Tag" : "Texte"}
                  </span>
                  {t.moderation_flag && (
                    <span className="flex items-center gap-1 rounded bg-destructive/15 px-2 py-0.5 font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3" /> {t.moderation_reason ?? "Signalée"}
                    </span>
                  )}
                  <span className="text-muted-foreground">{formatDate(t.created_at)}</span>
                </div>
                {t.trace_type === "tag" && t.drawing ? (
                  <TagView drawing={t.drawing} className="w-32" />
                ) : t.trace_type === "voice" && t.audio_url ? (
                  <>
                    <AudioPlayer src={t.audio_url} />
                    {t.transcript ? (
                      <p className="break-words text-sm italic text-muted-foreground">« {t.transcript} »</p>
                    ) : null}
                  </>
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
