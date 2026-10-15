import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CONTACT_EMAIL, t } from "@/lib/i18n";

const KEY = "traceon_terms_v1";
export const termsAccepted = () => localStorage.getItem(KEY) === "1";

/** Terms (EULA) shown until accepted; reopenable from the map. */
const TermsGate = ({ onAccept, onClose }: { onAccept: () => void; onClose?: () => void }) => {
  const [checked, setChecked] = useState(termsAccepted());
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/90 p-4 backdrop-blur">
      <Card className="max-h-full w-full max-w-md space-y-4 overflow-y-auto p-5">
        <h2 className="text-lg font-bold text-primary">{t.termsTitle}</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-foreground/90">
          {t.termsBody.map((l) => <li key={l}>{l}</li>)}
        </ul>
        <p className="text-sm text-muted-foreground">
          {t.contact} : <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          {t.termsAccept}
        </label>
        <div className="flex gap-2">
          {onClose && <Button variant="secondary" className="flex-1" onClick={onClose}>{t.close}</Button>}
          <Button
            className="flex-1"
            disabled={!checked}
            onClick={() => { localStorage.setItem(KEY, "1"); onAccept(); }}
          >
            OK
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TermsGate;
