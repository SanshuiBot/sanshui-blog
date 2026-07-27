import type { Metadata } from 'next';
import AboutContent from '@/components/About/AboutContent';

export const metadata: Metadata = {
  title: '关于',
  description: '关于三水个人博客',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <AboutContent />
    </div>
  );
}
