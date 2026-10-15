import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

// Privacy policy content, in French and English, following the phone language
// (same rule as src/lib/i18n.ts).
const fr = {
  title: "Politique de confidentialité",
  back: "Retour",
  updated: "Dernière mise à jour : 14 octobre 2026",
  intro: "TraceOn vous permet de laisser des messages anonymes à un endroit précis : un texte, un vocal ou un dessin (Tag). Les messages ne peuvent être lus qu'à moins de 50 mètres de l'endroit où ils ont été déposés.",
  sections: [
    {
      h: "Aucun compte, aucune donnée personnelle",
      p: "L'application ne demande ni nom, ni email, ni numéro de téléphone. Vous utilisez TraceOn sans compte : nous ne savons pas qui vous êtes.",
    },
    {
      h: "Votre position",
      p: "L'application utilise votre position pour vous montrer les traces autour de vous et pour en déposer une. Les coordonnées d'une trace que vous déposez sont enregistrées avec elle : c'est ce qui permet de l'afficher sur la carte et de la verrouiller au-delà de 50 mètres. Votre position n'est jamais enregistrée ailleurs et n'est pas partagée.",
    },
    {
      h: "Vos traces",
      p: "Quand vous déposez une trace, nous conservons : son texte (70 caractères maximum), ou son enregistrement vocal (8 secondes maximum), ou son dessin, ainsi que ses coordonnées et la date. Les enregistrements vocaux sont stockés dans un espace protégé, accessible uniquement par l'application. Personne ne peut modifier une trace après son dépôt.",
    },
    {
      h: "Aucun suivi publicitaire",
      p: "L'application ne contient pas de publicité, pas de traceurs publicitaires et ne vend aucune donnée.",
    },
    {
      h: "Prévention des abus",
      p: "Pour empêcher le flood et les dépôts massifs, l'application conserve une empreinte chiffrée de votre adresse réseau pendant quelques minutes. Elle ne permet pas de vous identifier.",
    },
    {
      h: "Modération",
      p: "Les traces sont vérifiées par une analyse automatique pour repérer les messages offensants, et un administrateur peut les relire et les supprimer. Les traces signalées restent lisibles uniquement à moins de 50 mètres, comme les autres.",
    },
    {
      h: "Suppression",
      p: "Les traces peuvent être supprimées par l'administrateur. Pour demander la suppression d'une trace, écrivez à l'adresse de contact ci-dessous en précisant le lieu et le contenu.",
    },
    {
      h: "Contact",
      p: "Pour toute question sur vos données : support@trace-on.app",
    },
  ],
};

const en: typeof fr = {
  title: "Privacy Policy",
  back: "Back",
  updated: "Last updated: October 14, 2026",
  intro: "TraceOn lets you leave anonymous messages at a specific spot: a text, a voice recording, or a drawing (Tag). Messages can only be read within 50 metres of where they were left.",
  sections: [
    {
      h: "No account, no personal data",
      p: "The app asks for no name, email or phone number. You use TraceOn without an account: we do not know who you are.",
    },
    {
      h: "Your location",
      p: "The app uses your location to show traces around you and to let you leave one. The coordinates of a trace you leave are stored with it: that is what places it on the map and locks it beyond 50 metres. Your location is never stored anywhere else and is not shared.",
    },
    {
      h: "Your traces",
      p: "When you leave a trace, we keep: its text (70 characters maximum), or its voice recording (8 seconds maximum), or its drawing, along with its coordinates and date. Voice recordings are stored in a protected space, accessible only by the app. Nobody can modify a trace after it is left.",
    },
    {
      h: "No advertising tracking",
      p: "The app contains no advertising, no ad trackers, and sells no data.",
    },
    {
      h: "Abuse prevention",
      p: "To prevent flooding and mass submissions, the app keeps an encrypted fingerprint of your network address for a few minutes. It cannot identify you.",
    },
    {
      h: "Moderation",
      p: "Traces are checked by an automated analysis to flag offensive messages, and an administrator can review and delete them. Flagged traces remain readable only within 50 metres, like all others.",
    },
    {
      h: "Deletion",
      p: "Traces can be deleted by the administrator. To request the deletion of a trace, write to the contact address below with the location and content.",
    },
    {
      h: "Contact",
      p: "For any question about your data: support@trace-on.app",
    },
  ],
};

const Privacy = () => {
  const c = (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("fr")) ? fr : en;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {c.back}
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-primary">{c.title}</h1>
            <p className="text-xs text-muted-foreground">{c.updated}</p>
          </div>
        </div>

        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">{c.intro}</p>

        <div className="space-y-8">
          {c.sections.map((s) => (
            <section key={s.h}>
              <h2 className="mb-2 font-semibold text-foreground">{s.h}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Privacy;
