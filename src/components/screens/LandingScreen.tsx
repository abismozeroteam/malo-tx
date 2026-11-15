import { DEFAULT_MEME_KEY } from "@/contracts/common";
import { routes } from "@/contracts/routes";
import { es } from "@/content/es";
import { catalogMemeView } from "@/content/memes";
import { LinkButton } from "@/components/ui/Button";
import { MemeCard } from "@/components/ui/MemeCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { Screen } from "@/components/ui/Screen";
import { BrandName, Wordmark } from "@/components/ui/Wordmark";

const t = es.landing;

export function LandingScreen() {
  return (
    <Screen>
      <Wordmark className="self-center" />
      <MemeCard meme={catalogMemeView(DEFAULT_MEME_KEY)} important />
      <PageHeading title={t.headline} />
      <p className="text-lead leading-ui">{t.lead}</p>
      <ul className="flex flex-col gap-2 text-body leading-ui text-muted">
        {t.points.map((point) => (
          <li key={point}>· {point}</li>
        ))}
      </ul>
      <LinkButton href={routes.signIn} className="gap-1.5">
        {t.cta}
        <BrandName className="text-meme leading-none" />
      </LinkButton>
    </Screen>
  );
}
