'use client';

import { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles as DreiSparkles, Points } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Individual floating orb that drifts slowly.
 */
function FloatingOrb({ position, color, size, speed }: {
  position: [number, number, number];
  color: string;
  size: number;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const initialPos = useRef(position);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * speed;
    ref.current.position.x = initialPos.current[0] + Math.sin(t * 0.7) * 2;
    ref.current.position.y = initialPos.current[1] + Math.cos(t * 0.5) * 1.5;
    ref.current.position.z = initialPos.current[2] + Math.sin(t * 0.3) * 0.5;
    ref.current.rotation.x = t * 0.1;
    ref.current.rotation.y = t * 0.15;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={0.12}
        roughness={0}
        metalness={0.1}
        transmission={0.9}
        thickness={2}
        ior={1.5}
      />
    </mesh>
  );
}

/**
 * Seeded pseudo-random for deterministic CSS fallback particles.
 * Same output on server and client — prevents hydration mismatch.
 */
function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * CSS-based particle fallback for mobile / reduced motion.
 * Uses deterministic seeded positions so SSR and client match.
 */
export function CSSFallbackParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${5 + seededRandom(i * 3) * 90}%`,
      top: `${5 + seededRandom(i * 3 + 1) * 90}%`,
      size: 1 + seededRandom(i * 3 + 2) * 3,
      delay: seededRandom(i * 7) * 5,
      duration: 3 + seededRandom(i * 11) * 4,
      color: ['#f472b6', '#c084fc', '#60a5fa', '#34d399', '#fbbf24'][
        Math.floor(seededRandom(i * 13) * 5)
      ],
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Mouse reactive glow — fixed: useEffect for event listeners instead of useMemo
 */
function MouseGlow() {
  const mouse = useRef({ x: 0, y: 0 });
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.x += (mouse.current.x * 5 - meshRef.current.position.x) * 0.05;
    meshRef.current.position.y += (mouse.current.y * 3 - meshRef.current.position.y) * 0.05;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -2]}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial
        color="#f472b6"
        transparent
        opacity={0.06}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Main 3D scene
 */
function ParticleSceneInner() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const particleCount = isMobile ? 300 : 1500;
  const sparklesCount = isMobile ? 15 : 50;

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#f472b6" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#60a5fa" />
      <pointLight position={[0, 0, 10]} intensity={0.4} color="#34d399" />

      {/* Floating holographic orbs */}
      <FloatingOrb position={[-4, 2, -3]} color="#f472b6" size={1.2} speed={0.3} />
      <FloatingOrb position={[4, -1, -4]} color="#60a5fa" size={1.5} speed={0.25} />
      <FloatingOrb position={[0, 3, -5]} color="#34d399" size={0.8} speed={0.35} />
      <FloatingOrb position={[-3, -2, -3.5]} color="#c084fc" size={1} speed={0.2} />
      <FloatingOrb position={[3, 1, -4.5]} color="#fbbf24" size={0.7} speed={0.4} />

      {/* Particle field — deterministic positions using a seed */}
      <Points
        positions={new Float32Array(
          Array.from({ length: particleCount * 3 }, (_, i) => {
            // Deterministic spread — same on server and client
            const x = (seededRandom(i * 2 + 1) - 0.5) * 12;
            const y = (seededRandom(i * 2 + 2) - 0.5) * 12;
            return i % 3 === 0 ? x : y;
          })
        )}
        stride={3}
        frustumCulled={false}
      >
        <pointsMaterial
          size={isMobile ? 0.04 : 0.03}
          color="#c084fc"
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </Points>

      {/* Sparkles */}
      <DreiSparkles
        position={[0, 0, -3]}
        count={sparklesCount}
        speed={0.3}
        opacity={0.7}
        size={4}
        color="#f472b6"
      />
    </>
  );
}

/**
 * Main exported component
 */
export default function ParticleBackground({
  reducedMotion = false,
  isMobile = false,
}: {
  reducedMotion?: boolean;
  isMobile?: boolean;
}) {
  const useFallback = reducedMotion || isMobile || typeof window === 'undefined';

  if (useFallback) {
    return (
      <>
        <CSSFallbackParticles />
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
      </>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      dpr={[1, 1.5]}
      style={{ position: 'fixed', inset: 0, zIndex: -10, pointerEvents: 'none' }}
      gl={{
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      }}
    >
      <ParticleSceneInner />
      <MouseGlow />
    </Canvas>
  );
}
