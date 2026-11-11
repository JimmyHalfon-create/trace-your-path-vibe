import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { isFrench, CONTACT_EMAIL } from "@/lib/i18n";

const fr = {
  title: "Assistance",
  back: "Retour",
  intro: "Une question, un problème, un contenu inapproprié ? Écrivez-nous, nous répondons sous 24 h.",
  contact: "Nous contacter",
  faq: [
    { q: "Comment signaler une trace ?", a: "Touchez la trace, puis touchez la fiche pour la retourner : choisissez « Signaler ». Tout nouveau signalement suspend immédiatement la trace pour tous les utilisateurs. Nous examinons les signalements sous 24 h : l'administrateur peut supprimer la trace, exclure son auteur ou la remettre en ligne si le signalement n'est pas justifié." },
    { q: "Comment retirer une trace de ma carte ?", a: "Retournez la fiche et choisissez « Masquer » : la trace disparaît aussitôt. « Bloquer l'auteur » masque toutes ses traces." },
    { q: "Qui peut utiliser TraceOn ?", a: "TraceOn est réservé aux personnes de 18 ans et plus." },
    { q: "Je ne vois aucune trace", a: "Autorisez la position dans les réglages du téléphone. Une trace ne s'ouvre qu'à 25 m maximum selon la position déclarée par votre appareil. Le GPS peut être imprécis, notamment entre les bâtiments. Une trace suspendue n'est plus accessible au public." },
    { q: "Pourquoi mes lectures sont-elles temporairement bloquées ?", a: "Pour limiter les abus, les demandes de lecture sont limitées à 60 en 10 minutes et 300 en 24 heures par connexion réseau. Plusieurs personnes sur le même Wi-Fi peuvent partager cette limite. Attendez avant de réessayer." },
    { q: "Supprimer une trace que j'ai déposée", a: "Écrivez-nous en indiquant le lieu et le contenu de la trace." },
  ],
  privacy: "Politique de confidentialité",
};

const en: typeof fr = {
  title: "Support",
  back: "Back",
  intro: "A question, a problem, inappropriate content? Email us — we reply within 24 hours.",
  contact: "Contact us",
  faq: [
    { q: "How do I report a trace?", a: "Tap the trace, then tap the card to flip it and choose “Report”. Each new report immediately suspends the trace for all users. We review reports within 24 hours: the administrator may delete the trace, ban its author or restore it if the report is unjustified." },
    { q: "How do I remove a trace from my map?", a: "Flip the card and choose “Hide”: the trace disappears instantly. “Block author” hides all of their traces." },
    { q: "Who can use TraceOn?", a: "TraceOn is for people aged 18 and over." },
    { q: "I can't see any traces", a: "Allow location in your phone settings. A trace only opens within a maximum of 25 m according to the location reported by your device. GPS can be inaccurate, especially between buildings. Suspended traces are no longer publicly accessible." },
    { q: "Why are my reads temporarily blocked?", a: "To limit abuse, read requests are limited to 60 in 10 minutes and 300 in 24 hours per network connection. People sharing Wi-Fi may share the limit. Wait before trying again." },
    { q: "Delete a trace I left", a: "Email us with the place and content of the trace." },
  ],
  privacy: "Privacy Policy",
};

const Support = () => {
  const c = isFrench ? fr : en;
  return (
    <div className="min-h-screen overflow-y-auto bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {c.back}
        </Link>
        <h1 className="text-2xl font-bold tracking-wide text-primary">{c.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{c.intro}</p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground"
        >
          <Mail className="h-4 w-4" /> {c.contact} — {CONTACT_EMAIL}
        </a>
        <div className="mt-10 space-y-6">
          {c.faq.map((f) => (
            <section key={f.q}>
              <h2 className="mb-1 font-semibold">{f.q}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </section>
          ))}
        </div>
        <Link to="/privacy" className="mt-10 inline-block text-sm text-muted-foreground underline">{c.privacy}</Link>
      </div>
    </div>
  );
};

export default Support;
