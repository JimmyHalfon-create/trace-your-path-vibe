import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Mic, PenLine, Lock } from "lucide-react";
import { isFrench } from "@/lib/i18n";

// Lien d'invitation Google Play (Play Console → Tests et publication → Tests → Testeurs → lien d'invitation).
// Tant qu'il est vide, l'encadré affiche le contact e-mail au lieu d'un lien mort.
const ANDROID_TEST_INVITE_URL = "";

const copies = {
  fr: {
    tagline: "Certains mots appartiennent à un lieu.",
    intro: "Laissez des messages anonymes — texte, vocal ou tag dessiné — accrochés à un endroit précis. Pour les découvrir, il faut s'y rendre.",
    features: [
      { icon: PenLine, title: "Texte ou tag", body: "70 caractères ou un mini graffiti dessiné au doigt." },
      { icon: Mic, title: "Vocal", body: "8 secondes de voix, laissées sur place." },
      { icon: Lock, title: "À moins de 25 m", body: "Une trace ne s'ouvre que lorsque vous êtes tout près." },
      { icon: MapPin, title: "Anonyme", body: "Aucun compte, aucun nom, aucun suivi publicitaire." },
    ],
    storeAlt: "Télécharger TraceOn sur l'App Store",
    playAlt: "Télécharger TraceOn sur Google Play",
    privacy: "Confidentialité",
    support: "Assistance",
    tester: {
      title: "Devenir testeur Android",
      body: "TraceOn est encore en test sur Google Play. Il faut 2 minutes : ouvrir le lien, accepter, installer.",
      steps: [
        "Ouvrir le lien d'invitation sur votre téléphone Android",
        "Toucher « Devenir testeur »",
        "Installer TraceOn depuis le Play Store",
      ],
      cta: "Ouvrir le lien de test",
      closed: "Le lien d'invitation est en cours de préparation. Écrivez à support@trace-on.app et nous vous l'envoyons.",
    },
  },
  en: {
    tagline: "Some words belong to a place.",
    intro: "Leave anonymous messages — text, voice or a hand-drawn tag — pinned to a precise spot. To discover them, you have to go there.",
    features: [
      { icon: PenLine, title: "Text or tag", body: "70 characters or a tiny graffiti drawn with your finger." },
      { icon: Mic, title: "Voice", body: "8 seconds of voice, left on the spot." },
      { icon: Lock, title: "Within 25 m", body: "A trace only opens when you're right there." },
      { icon: MapPin, title: "Anonymous", body: "No account, no name, no ad tracking." },
    ],
    storeAlt: "Download TraceOn on the App Store",
    playAlt: "Download TraceOn on Google Play",
    privacy: "Privacy",
    support: "Support",
    tester: {
      title: "Become an Android tester",
      body: "TraceOn is still in testing on Google Play. It takes 2 minutes: open the link, accept, install.",
      steps: [
        "Open the invitation link on your Android phone",
        "Tap “Become a tester”",
        "Install TraceOn from the Play Store",
      ],
      cta: "Open the test link",
      closed: "The invitation link is being prepared. Write to support@trace-on.app and we'll send it to you.",
    },
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
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <img
            src="/app-store-badge.png"
            alt={copy.storeAlt}
            className="h-auto w-44 max-w-full rounded-lg"
          />
          <img
            src="/google-play-badge.png"
            alt={copy.playAlt}
            className="h-auto w-44 max-w-full rounded-lg"
          />
        </div>
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
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{copy.tester.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{copy.tester.body}</p>
          <ol className="mt-4 space-y-2">
            {copy.tester.steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="text-sm text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
          {ANDROID_TEST_INVITE_URL ? (
            <a
              href={ANDROID_TEST_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {copy.tester.cta}
            </a>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">{copy.tester.closed}</p>
          )}
        </div>
      </section>
      <footer className="pb-10 text-center text-xs text-muted-foreground">
        <Link to="/privacy" className="underline-offset-2 hover:underline">{copy.privacy}</Link>
        <span className="mx-2">·</span>
        <Link to="/support" className="underline-offset-2 hover:underline">{copy.support}</Link>
        <span className="mx-2">·</span>© TraceOn
      </footer>
    </main>
  );
};

export default Landing;
