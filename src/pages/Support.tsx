import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { isFrench, CONTACT_EMAIL } from "@/lib/i18n";

const fr = {
  title: "Assistance",
  back: "Retour",
  intro: "Une question, un problème, un contenu inapproprié ? Écrivez-nous, nous répondons sous 24 h.",
  contact: "Nous contacter",
  faq: [
    { q: "Comment signaler une trace ?", a: "Touchez la trace, puis touchez la fiche pour la retourner : choisissez « Signaler ». La trace disparaît immédiatement de votre carte. Chaque signalement est traité sous 24 h : le contenu est supprimé et son auteur exclu de l'app." },
    { q: "Comment retirer une trace de ma carte ?", a: "Retournez la fiche et choisissez « Masquer » : la trace disparaît aussitôt. « Bloquer l'auteur » masque toutes ses traces." },
    { q: "Qui peut utiliser TraceOn ?", a: "TraceOn est réservé aux personnes de 18 ans et plus." },
    { q: "Je ne vois aucune trace", a: "Autorisez la position dans les réglages du téléphone. Une trace ne s'ouvre qu'à moins de 50 m." },
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
    { q: "How do I report a trace?", a: "Tap the trace, then tap the card to flip it and choose “Report”. The trace disappears from your map immediately. Every report is handled within 24 hours: the content is removed and its author is ejected from the app." },
    { q: "How do I remove a trace from my map?", a: "Flip the card and choose “Hide”: the trace disappears instantly. “Block author” hides all of their traces." },
    { q: "Who can use TraceOn?", a: "TraceOn is for people aged 18 and over." },
    { q: "I can't see any traces", a: "Allow location in your phone settings. A trace only opens within 50 m." },
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
