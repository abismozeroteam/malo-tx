import { es } from "@/content/es";
import { LinkButton } from "@/components/ui/Button";
import { MemeCard } from "@/components/ui/MemeCard";
import { Screen } from "@/components/ui/Screen";
import { Wordmark } from "@/components/ui/Wordmark";

const t = es.landing;

export function LandingScreen() {
  return (
    <Screen>
      <Wordmark className="self-center" />
      <MemeCard meme={{ kind: "catalog", key: "a", caption: es.memes.defaultCaption.a }} />
      <h1 className="text-title font-bold leading-heading">{t.headline}</h1>
      <p className="text-lead leading-ui">{t.lead}</p>
      <ul className="flex flex-col gap-2 text-body leading-ui text-muted">
        {t.points.map((point) => (
          <li key={point}>· {point}</li>
        ))}
      </ul>
      <LinkButton href="/entrar">{t.cta}</LinkButton>
    </Screen>
  );
}
