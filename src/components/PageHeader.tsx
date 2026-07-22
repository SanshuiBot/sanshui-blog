'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps { title: string; description?: string; backHref?: string; backLabel?: string; children?: React.ReactNode; }

export default function PageHeader({ title, description, backHref = '/', backLabel = '返回首页', children }: PageHeaderProps) {
  return (
    <div className="mb-10">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors mb-6 group/back">
        <ArrowLeft size={16} className="transition-transform duration-300 group/back:-translate-x-1" />{backLabel}
      </Link>
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ viewTransitionName: 'page-title' }} className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50 tracking-tight"
      >{title}</motion.h1>
      {description && <p className="mt-3 text-stone-500 dark:text-stone-500">{description}</p>}
      {children}
    </div>
  );
}
