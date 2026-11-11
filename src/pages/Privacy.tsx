import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Privacy policy content, in French and English, following the phone language
// (same rule as src/lib/i18n.ts).
const fr = {
  title: "Politique de confidentialité",
  back: "Retour",
  updated: "Dernière mise à jour : 11 novembre 2026",
  intro: "TraceOn vous permet de laisser des messages sans nom public à un endroit précis : un texte, un vocal ou un dessin (Tag). La lecture ou l'écoute d'une trace est autorisée à 25 mètres maximum selon la position déclarée par votre appareil. Cette position peut être imprécise ou falsifiée : ce contrôle ne garantit pas une présence physique.",
  sections: [
    {
      h: "Sans compte, avec des identifiants pseudonymes",
      p: "L'application ne demande ni nom, ni email, ni numéro de téléphone pour utiliser la carte. Un identifiant aléatoire est conservé sur votre appareil ; une empreinte hachée permet de relier les traces d'un même auteur pour les masquer, traiter les signalements et empêcher les dépôts d'un auteur exclu. Cela constitue une pseudonymisation, pas un anonymat absolu. Un message, un vocal ou un lieu peut révéler votre identité : évitez d'y inclure des informations personnelles. L'administration utilise une connexion par e-mail.",
    },
    {
      h: "Votre position",
      p: "Votre position est utilisée pour afficher la carte, déposer une trace et vérifier la distance lors d'une demande de lecture. Les coordonnées exactes d'une trace sont enregistrées avec elle et accessibles dans le flux des points de la carte, sans son contenu. La carte est fournie par Mapbox ; les traces et les demandes de lecture sont traitées par Supabase. TraceOn n'enregistre pas d'historique de vos déplacements dans ses tables applicatives ; les prestataires peuvent conserver des journaux techniques.",
    },
    {
      h: "Vos traces",
      p: "Nous conservons le texte (70 caractères maximum), le vocal (8 secondes maximum) ou le dessin, ses coordonnées, sa date et l'empreinte de son auteur. Une transcription et des résultats de modération peuvent être ajoutés. Les vocaux sont stockés dans un espace privé ; la lecture autorisée utilise un lien temporaire de 120 secondes. Un administrateur peut consulter les contenus pour les modérer. Les traces restent conservées jusqu'à leur suppression ; l'utilisateur ne peut pas les modifier après dépôt.",
    },
    {
      h: "Aucun suivi publicitaire",
      p: "L'application ne contient pas de publicité, pas de traceurs publicitaires et ne vend aucune donnée.",
    },
    {
      h: "Prévention des abus",
      p: "Pour limiter les dépôts et lectures massifs, une empreinte hachée avec un secret de l'adresse IP est enregistrée, et non l'adresse IP brute, dans les tables de limitation. Les compteurs portent sur les dernières 24 heures ; les entrées plus anciennes sont supprimées lors de nettoyages déclenchés par les requêtes, pas à une heure fixe. La lecture est limitée à 60 demandes en 10 minutes et 300 en 24 heures par empreinte réseau ; plusieurs personnes sur le même Wi-Fi peuvent partager ces limites. L'empreinte d'auteur, les exclusions et les signalements sont conservés séparément et ne sont pas effacés par ce nettoyage.",
    },
    {
      h: "Modération",
      p: "Une analyse automatique peut traiter les textes et les transcriptions pour repérer des contenus offensants ; elle peut échouer et ne garantit pas que tous les contenus sont vérifiés. Les contenus analysés sont transmis au service d'IA via Lovable. Tout nouveau signalement suspend immédiatement la trace : elle n'est plus accessible au public, même à proximité. Un administrateur examine le signalement, peut supprimer la trace ou la rétablir s'il n'est pas justifié, et peut exclure l'auteur. Les signalements résolus sont conservés. Masquer et Bloquer l'auteur enregistrent vos choix sur votre appareil et ne suppriment pas les contenus pour les autres utilisateurs.",
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
  updated: "Last updated: November 11, 2026",
  intro: "TraceOn lets you leave messages without a public name at a specific spot: a text, a voice recording, or a drawing (Tag). Reading or listening is allowed within a maximum of 25 metres according to the location reported by your device. That location may be inaccurate or falsified: this check does not guarantee physical presence.",
  sections: [
    {
      h: "No account, with pseudonymous identifiers",
      p: "No name, email or phone number is required to use the map. A random identifier is stored on your device; a hashed fingerprint links traces from the same author to hide them, process reports and prevent submissions by banned authors. This is pseudonymisation, not absolute anonymity. A message, voice or location can reveal your identity: avoid including personal information. Administration uses an email sign-in.",
    },
    {
      h: "Your location",
      p: "Your location is used to display the map, leave a trace and check distance when requesting its content. A trace's exact coordinates are stored and accessible in the map marker feed, without its content. Mapbox provides the map; Supabase processes traces and read requests. TraceOn does not store a history of your movements in its application tables; providers may retain technical logs.",
    },
    {
      h: "Your traces",
      p: "We store the text (70 characters maximum), voice recording (8 seconds maximum) or drawing, its coordinates, date and author fingerprint. A transcript and moderation results may be added. Recordings are stored privately; authorised playback uses a temporary link lasting 120 seconds. An administrator can access content for moderation. Traces are retained until deletion; users cannot edit them after submission.",
    },
    {
      h: "No advertising tracking",
      p: "The app contains no advertising, no ad trackers, and sells no data.",
    },
    {
      h: "Abuse prevention",
      p: "To limit mass submissions and reads, the rate-limit tables store an IP fingerprint hashed with a secret, not the raw IP address. Counters cover the last 24 hours; older entries are deleted by request-triggered cleanups, not on a fixed schedule. Reads are limited to 60 requests in 10 minutes and 300 in 24 hours per network fingerprint; people sharing Wi-Fi may share these limits. Author fingerprints, bans and reports are stored separately and are not removed by this cleanup.",
    },
    {
      h: "Moderation",
      p: "Automated analysis may process texts and transcripts to detect offensive content; it can fail and does not guarantee that all content is checked. Analysed content is sent to the AI service through Lovable. Each new report immediately suspends the trace: it is no longer publicly accessible, even nearby. An administrator reviews the report and may delete the trace or restore it if the report is unjustified, and may ban the author. Resolved reports are retained. Hide and Block author store your choices on your device and do not remove content for other users.",
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
          <svg viewBox="0 0 100 100" className="h-9 w-9" fill="none" aria-hidden="true">
            <path
              d="M 81.9 43.4 A 34 34 0 1 1 55.9 21.5"
              className="stroke-primary"
              strokeWidth={14}
            />
            <circle cx={74.2} cy={24.7} r={11.2} className="fill-primary" />
          </svg>
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
