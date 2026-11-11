import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, List, LogOut, Map, RefreshCw, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AdminTraceCard from "@/components/AdminTraceCard";
import AdminTraceMap from "@/components/AdminTraceMap";
import { useIsAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { approveTrace, banAuthor, deleteTrace, fetchAdminTraces, moderatePendingTraces, type AdminTrace as Trace } from "@/lib/traces";

const Admin = () => {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [filter, setFilter] = useState<"all" | "suspended" | "live">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<Trace | null>(null);
  const selected = traces.find((trace) => trace.id === selectedId);
  const visible = traces.filter((trace) => filter === "all" || (filter === "suspended" ? trace.hidden : !trace.hidden));
  const select = useCallback((trace: Trace) => setSelectedId(trace.id), []);
  const load = useCallback(async () => { setTraces(await fetchAdminTraces()); }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const refresh = async () => {
      const rows = await fetchAdminTraces();
      if (!cancelled) setTraces(rows);
    };
    refresh().catch(() => toast.error("Impossible de charger les traces")).finally(() => { if (!cancelled) setLoading(false); });
    setAnalysing(true);
    moderatePendingTraces().then((n) => n > 0 ? refresh() : undefined).catch((e: Error) => toast.error(e.message)).finally(() => { if (!cancelled) setAnalysing(false); });
    return () => { cancelled = true; };
  }, [isAdmin]);

  if (isAdmin === null) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Chargement…</p></div>;
  if (!isAdmin) return <Navigate to="/auth" replace />;

  const remove = async (trace: Trace) => {
    if (!confirm("Supprimer cette trace ?")) return;
    setBusy(true);
    try { await deleteTrace(trace); setTraces((rows) => rows.filter((row) => row.id !== trace.id)); toast.success("Trace supprimée"); }
    catch { toast.error("Suppression impossible"); }
    finally { setBusy(false); }
  };
  const restore = async (trace: Trace) => {
    setBusy(true);
    try {
      await approveTrace(trace.id);
      await load();
      toast.success("Trace remise en ligne, signalements classés");
    } catch { toast.error("Rétablissement impossible"); }
    finally { setBusy(false); }
  };
  const ban = async (trace: Trace) => {
    if (!confirm("Exclure cet auteur ? Toutes ses traces seront supprimées et il ne pourra plus publier.")) return;
    setBusy(true);
    try { const ids = await banAuthor(trace, traces); setTraces((rows) => rows.filter((row) => !ids.includes(row.id))); toast.success(`Auteur exclu, ${ids.length} trace(s) supprimée(s)`); }
    catch (error) { toast.error((error as Error).message); }
    finally { setBusy(false); }
  };
  const locate = (trace: Trace) => { setFocus(trace); setSelectedId(trace.id); setView("map"); };
  const refresh = async () => { setLoading(true); try { await load(); } catch { toast.error("Impossible de charger les traces"); } finally { setLoading(false); } };
  const voiceCount = traces.filter((trace) => trace.trace_type === "voice").length;
  const tagCount = traces.filter((trace) => trace.trace_type === "tag").length;
  const stats = [{ label: "Total", value: traces.length }, { label: "Texte", value: traces.length - voiceCount - tagCount }, { label: "Tag", value: tagCount }, { label: "Vocal", value: voiceCount }, { label: "Suspendues", value: traces.filter((trace) => trace.hidden).length }];
  const actions = { busy: busy || analysing, onRestore: restore, onRemove: remove, onBan: ban };

  return (
    <div className="safe-top min-h-screen bg-background px-4 pb-8">
      <div className={`mx-auto space-y-4 ${view === "map" ? "max-w-6xl" : "max-w-3xl"}`}>
        <header className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}><ArrowLeft className="mr-1 h-4 w-4" />Retour</Button>
          <h1 className="text-lg font-bold text-primary">Administration</h1>
          <Button variant="ghost" size="icon" title="Déconnexion" aria-label="Déconnexion" onClick={async () => { await supabase.auth.signOut(); navigate("/", { replace: true }); }}><LogOut className="h-4 w-4" /></Button>
        </header>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{stats.map((stat) => <Card key={stat.label} className="p-3 text-center"><p className={`text-2xl font-bold ${stat.label === "Suspendues" && stat.value ? "text-destructive" : "text-primary"}`}>{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></Card>)}</div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="flex gap-1" role="group" aria-label="Affichage"><Button size="sm" variant={view === "list" ? "default" : "outline"} aria-pressed={view === "list"} onClick={() => setView("list")}><List className="mr-1 h-4 w-4" />Liste</Button><Button size="sm" variant={view === "map" ? "default" : "outline"} aria-pressed={view === "map"} onClick={() => { setFocus(null); setView("map"); }}><Map className="mr-1 h-4 w-4" />Carte</Button></div>
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="État des traces">{([{ value: "all", label: "Toutes" }, { value: "suspended", label: "Suspendues" }, { value: "live", label: "En ligne" }] as const).map((option) => <Button key={option.value} size="sm" variant={filter === option.value ? "secondary" : "ghost"} aria-pressed={filter === option.value} onClick={() => { setFilter(option.value); setSelectedId(null); setFocus(null); }}>{option.label}</Button>)}<Button variant="ghost" size="icon" title="Actualiser" aria-label="Actualiser" disabled={loading || busy} onClick={refresh}><RefreshCw className="h-4 w-4" /></Button></div>
        </div>
        {analysing && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />Analyse IA des nouvelles traces…</p>}
        {loading ? <p className="py-8 text-center text-muted-foreground">Chargement…</p> : view === "map" ? <>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-primary" />En ligne</span><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-destructive" />Suspendue</span><span>{visible.length} trace(s)</span></div>
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]"><AdminTraceMap key={`${filter}-${focus?.id ?? "all"}`} traces={visible} onSelect={select} focus={focus} />
          <aside className="min-w-0">{selected ? <><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-medium">Trace sélectionnée</h2><Button variant="ghost" size="icon" aria-label="Fermer la sélection" title="Fermer" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></Button></div><AdminTraceCard trace={selected} {...actions} /></> : <p className="py-4 text-sm text-muted-foreground">{visible.length ? "Aucune trace sélectionnée" : "Aucune trace"}</p>}</aside></div>
        </> : visible.length === 0 ? <p className="py-8 text-center text-muted-foreground">Aucune trace</p> : visible.map((trace) => <AdminTraceCard key={trace.id} trace={trace} {...actions} onLocate={locate} />)}
      </div>
    </div>
  );
};

export default Admin;
