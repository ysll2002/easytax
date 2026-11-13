'use client';
import { useTranslations } from 'next-intl';

// WCAG 2.4.1 Bypass Blocks. The target is the page's <main>; every page has
// one, and most give it id="main-content". The click handler also covers a
// <main> without the id, and moves focus there, which a plain fragment link
// does not reliably do in every browser.
export default function SkipLink() {
  const t = useTranslations('a11y');
  return (
    <a
      href="#main-content"
      className="skip-link"
      onClick={e => {
        const main = document.getElementById('main-content') ?? document.querySelector('main');
        if (!main) return;
        e.preventDefault();
        if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
        (main as HTMLElement).focus();
        main.scrollIntoView();
      }}
    >
      {t('skipToContent')}
    </a>
  );
}
