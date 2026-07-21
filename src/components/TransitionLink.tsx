'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps, MouseEvent } from 'react';

type TransitionLinkProps = ComponentProps<typeof NextLink>;

/**
 * Wraps `next/link` so in-app navigation uses the browser's View Transitions
 * API when available. Gives an instant cross-fade between pages instead of
 * the default blank frame + framer-motion entrance replay.
 *
 * On browsers without `document.startViewTransition` it falls back to the
 * normal Next.js client navigation, so nothing breaks.
 */
export default function TransitionLink({ href, onClick, ...props }: TransitionLinkProps) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    // Only intercept plain left-clicks on same-document URLs.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    const url = typeof href === 'string' ? href : (href as { pathname?: string }).pathname ?? '';
    if (!url || url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('#')) {
      return;
    }

    const dt = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    if (typeof dt.startViewTransition !== 'function') return;

    // Hand navigation to startViewTransition so the browser cross-fades.
    event.preventDefault();
    dt.startViewTransition(() => {
      router.push(url);
    });
  };

  return <NextLink href={href} onClick={handleClick} {...props} />;
}
