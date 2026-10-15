import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Mic, PenLine, Lock } from "lucide-react";
import { isFrench } from "@/lib/i18n";

const copies = {
  fr: {
    tagline: "Certains mots appartiennent à un lieu.",
    intro: "Laissez des messages anonymes — texte, vocal ou tag dessiné — accrochés à un endroit précis. Pour les découvrir, il faut s'y rendre.",
    features: [
      { icon: PenLine, title: "Texte ou tag", body: "70 caractères ou un mini graffiti dessiné au doigt." },
      { icon: Mic, title: "Vocal", body: "8 secondes de voix, laissées sur place." },
      { icon: Lock, title: "À moins de 50 m", body: "Une trace ne s'ouvre que lorsque vous êtes tout près." },
      { icon: MapPin, title: "Anonyme", body: "Aucun compte, aucun nom, aucun suivi publicitaire." },
    ],
    soon: "Disponible bientôt sur iPhone",
    privacy: "Confidentialité",
  },
  en: {
    tagline: "Some words belong to a place.",
    intro: "Leave anonymous messages — text, voice or a hand-drawn tag — pinned to a precise spot. To discover them, you have to go there.",
    features: [
      { icon: PenLine, title: "Text or tag", body: "70 characters or a tiny graffiti drawn with your finger." },
      { icon: Mic, title: "Voice", body: "8 seconds of voice, left on the spot." },
      { icon: Lock, title: "Within 50 m", body: "A trace only opens when you're right there." },
      { icon: MapPin, title: "Anonymous", body: "No account, no name, no ad tracking." },
    ],
    soon: "Coming soon on iPhone",
    privacy: "Privacy",
  },
} as const;

type Lang = keyof typeof copies;

const Landing = () => {
  const [lang, setLang] = useState<Lang>(isFrench ? "fr" : "en");
  const copy = copies[lang];

  return (
    <main className="min-h-screen overflow-y-auto bg-background text-foreground">
      <div className="flex justify-end px-6 pt-6">
        <div className="flex rounded-full border border-border bg-card text-sm font-medium" role="group" aria-label="Language / Langue">
          {(["fr", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`rounded-full px-4 py-1.5 uppercase transition-colors ${
                lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-16 pt-12 text-center">
        <img src="/apple-touch-icon.png" alt="TraceOn" className="h-28 w-28 rounded-[1.75rem] shadow-2xl" />
        <h1 className="mt-8 text-5xl font-bold tracking-widest text-primary">TraceOn</h1>
        <p className="mt-4 text-xl text-foreground/90">{copy.tagline}</p>
        <p className="mt-6 max-w-xl text-muted-foreground">{copy.intro}</p>
        <span className="mt-10 rounded-full border border-primary/50 bg-primary/10 px-5 py-2 text-sm font-medium text-primary">
          {copy.soon}
        </span>
      </section>
      <section className="mx-auto grid max-w-3xl gap-4 px-6 pb-16 sm:grid-cols-2">
        {copy.features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-5">
            <Icon className="h-5 w-5 text-primary" />
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
      <footer className="pb-10 text-center text-xs text-muted-foreground">
        <Link to="/privacy" className="underline-offset-2 hover:underline">{copy.privacy}</Link>
        <span className="mx-2">·</span>© TraceOn
      </footer>
    </main>
  );
};

export default Landing;
