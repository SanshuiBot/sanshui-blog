'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Lazy-load Three.js particle background — never SSR
const ParticleScene = dynamic(
  () => import('@/components/ParticleBackground').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <StaticAmbientBg />,
  },
);

/**
 * Static ambient gradient — no random values, safe for SSR hydration.
 * Matches the dynamic fallback in ParticleBackground so the transition is seamless.
 */
function StaticAmbientBg() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `
          radial-gradient(ellipse 50% 40% at 20% 30%, rgba(244, 114, 182, 0.12) 0%, transparent 60%),
          radial-gradient(ellipse 40% 50% at 80% 20%, rgba(96, 165, 250, 0.1) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 60% 80%, rgba(52, 211, 153, 0.08) 0%, transparent 60%)
        `,
        animation: 'aurora-flow 20s ease-in-out infinite alternate',
      }}
    />
  );
}

export default function ParticleBackgroundWrapper() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  return <ParticleScene reducedMotion={false} isMobile={isMobile} />;
}
