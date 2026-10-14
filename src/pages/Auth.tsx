import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

/** Admin-only magic-link sign in. Never creates accounts; leads to /admin. */
const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/admin", { replace: true });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/admin", { replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/admin` },
    });
    setLoading(false);
    // Same message whatever happens: never reveal which emails exist.
    setSent(true);
    toast.success("Si cet email est autorisé, un lien vous a été envoyé");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm space-y-6 p-8">
        <div className="space-y-2 text-center">
          <Shield className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold tracking-widest text-primary">TraceOn</h1>
          <p className="text-sm text-muted-foreground">Accès administrateur</p>
        </div>
        {sent ? (
          <p className="text-center text-sm text-muted-foreground">
            Ouvrez le lien reçu par email pour accéder au back-office.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Envoi..." : "Recevoir un lien magique"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Auth;
