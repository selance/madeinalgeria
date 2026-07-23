/**
 * Footer — brand green fading into a clean secondary band at the bottom
 * (graphic sunset, not a scene), with visible grain over the color.
 * All icons come from the design system.
 *
 * Ships no JS: it renders on every page, so the one interactive part (the
 * newsletter opt-in) arrives through the `newsletter` slot as its own island —
 * a nested island is only allowed because this component is never hydrated.
 */
import type { ReactNode } from "react";
import { cn } from "@mia/ui";
import Logo from "@mia/ui/icons/Logo";
import GithubIcon from "@mia/ui/icons/GithubIcon";
import EmailIcon from "@mia/ui/icons/EmailIcon";
import { localizePath, ui, type Locale } from "../../lib/i18n";

/** Same film-grain texture as the landing sections, blended darker over the sky. */
const NOISE_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncR type='linear' slope='0.7' intercept='0.2'/><feFuncG type='linear' slope='0.7' intercept='0.2'/><feFuncB type='linear' slope='0.7' intercept='0.2'/></feComponentTransfer></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.8'/></svg>\")";

const CONTACT_EMAIL = "moncef@mochir.com";
const GITHUB_URL = "https://github.com/selance/madeinalgeria";
const SELANCE_URL = "https://selance.com";

const socialBtn = cn(
  "flex size-9 items-center justify-center rounded-lg border !border-white/15 bg-white/10",
  "transition-colors hover:!border-secondary-400 hover:bg-secondary-500",
);

interface FooterProps {
  locale?: Locale;
  /** The newsletter form island, passed as a named slot from Base.astro. */
  newsletter?: ReactNode;
}

const Footer = ({ locale = "en", newsletter }: FooterProps) => {
  const t = ui[locale];
  const links = [
    { href: localizePath("/", locale), label: t.footer.home },
    { href: localizePath("/projects", locale), label: t.nav.projects },
    { href: localizePath("/developers", locale), label: t.hubs.developersTitle },
    { href: localizePath("/projects/top", locale), label: t.hubs.topTitle },
    { href: localizePath("/projects/new", locale), label: t.hubs.newTitle },
    { href: localizePath("/about", locale), label: t.nav.about },
    { href: localizePath("/submit", locale), label: t.nav.submit },
    { href: localizePath("/hire", locale), label: t.footer.hire },
  ];

  return (
    <footer className="from-primary-500 to-primary-700 relative overflow-hidden bg-linear-to-b text-primary-50">
      {/* clean secondary band rising from the bottom edge */}
      <div aria-hidden className="from-secondary-500/70 pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-linear-to-t to-transparent" />
      {/* visible grain over the brand color */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-35 mix-blend-overlay" style={{ backgroundImage: NOISE_BG }} />

      <div className="relative mx-auto w-full max-w-7xl px-6 pb-8 pt-14 md:pt-16">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* brand */}
          <div>
            <Logo className="mb-4 h-8 w-auto" />
            <p className="leading-relaxed text-primary-50/90">{t.footer.blurb}</p>
            <div className="mt-6 flex gap-3">
              <a
                target="_blank"
                rel="noreferrer"
                href={GITHUB_URL}
                aria-label="GitHub"
                className={socialBtn}
              >
                <GithubIcon className="size-4 fill-white" />
              </a>
            </div>
          </div>

          {/* links */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">{t.footer.linksTitle}</h3>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-secondary-300 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* contact */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">{t.footer.contactTitle}</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="hover:text-secondary-300 flex items-center gap-2 transition-colors"
                >
                  <EmailIcon className="fill-secondary-300 size-4 shrink-0" />
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>

          {/* newsletter */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">{t.footer.newsletterTitle}</h3>
            <p className="mb-4 text-primary-50/90">{t.footer.newsletterBody}</p>
            {newsletter}
            <a
              href={localizePath("/rss.xml", locale)}
              className="hover:text-secondary-300 mt-3 inline-block text-sm text-primary-100/80 transition-colors"
            >
              {t.feed.subscribe}
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t !border-white/20 pt-6 md:flex-row">
          <p className="text-sm text-primary-100/80">
            © 2026 {t.siteName}. {t.footer.rights}{" "}
            <span className="ms-1">
              {t.footer.builtBy}{" "}
              {/* Cross-brand credit: noopener (not noreferrer) so the referrer +
                  link equity reach selance.com — an honest attribution link. */}
              <a
                href={SELANCE_URL}
                target="_blank"
                rel="noopener"
                title={t.footer.studioTitle}
                className="hover:text-secondary-300 font-semibold text-white transition-colors"
              >
                Selance
              </a>
              <span className="text-primary-100/70">{t.footer.studioSuffix}</span>
            </span>
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-primary-100/80">
            <a href="/privacy" className="hover:text-secondary-300 transition-colors">
              {t.footer.privacy}
            </a>
            <a href="/terms" className="hover:text-secondary-300 transition-colors">
              {t.footer.terms}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
