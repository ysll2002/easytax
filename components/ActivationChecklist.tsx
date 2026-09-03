'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Landmark, Building2, Check, ChevronRight } from 'lucide-react';
import { trackClient } from './PageViewTracker';

// Post-signup activation.
//
// 45 accounts have produced 15 HMRC connections and 1 bank connection. The
// dashboard currently opens on a "Self Assessment or Company?" fork, which
// tells a new user what the product *is* but not what they should do next — so
// two thirds of them do nothing and never return.
//
// The steps shown here are the two that gate every downstream action.

type Props = {
  hmrcConnected: boolean;
  bankConnected: boolean;
};

export default function ActivationChecklist({ hmrcConnected, bankConnected }: Props) {
  const t = useTranslations('dashboard.activation');

  const steps = [
    {
      key: 'hmrc',
      done: hmrcConnected,
      href: '/dashboard/individual/hmrc',
      icon: Landmark,
      title: t('hmrcTitle'),
      desc: t('hmrcDesc'),
    },
    {
      key: 'bank',
      done: bankConnected,
      href: '/dashboard/banking',
      icon: Building2,
      title: t('bankTitle'),
      desc: t('bankDesc'),
    },
  ];

  const doneCount = steps.filter(s => s.done).length;

  // Nothing left to nudge — showing an all-green checklist forever just adds
  // noise to the dashboard of the users who did everything right.
  if (doneCount === steps.length) return null;

  return (
    <div
      className="p-5 sm:p-6 rounded-2xl mb-8"
      style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <p
          style={{
            fontFamily: 'var(--font-display), Playfair Display, Georgia, serif',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#1C1208',
          }}
        >
          {t('title')}
        </p>
        <p className="text-xs font-semibold flex-shrink-0" style={{ color: '#9A8F83' }}>
          {t('progress', { done: doneCount, total: steps.length })}
        </p>
      </div>

      <div className="space-y-2.5">
        {steps.map(step => {
          const Icon = step.icon;

          if (step.done) {
            return (
              <div
                key={step.key}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: '#FDFCF8', border: '1px solid #E8E2DA', opacity: 0.75 }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#6B8E6E' }}
                >
                  <Check size={15} color="#FDFCF8" strokeWidth={2.6} />
                </div>
                <p
                  className="text-sm font-medium"
                  style={{ color: '#4A4035', textDecoration: 'line-through' }}
                >
                  {step.title}
                </p>
              </div>
            );
          }

          return (
            <Link
              key={step.key}
              href={step.href}
              onClick={() => trackClient('activation_cta_click', { step: step.key })}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2DA', minHeight: '44px' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#C4622D' }}
                >
                  <Icon size={16} color="#FDFCF8" strokeWidth={1.9} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold mb-0.5" style={{ color: '#1C1208' }}>
                    {step.title}
                  </p>
                  <p className="text-xs" style={{ color: '#9A8F83', lineHeight: 1.5 }}>
                    {step.desc}
                  </p>
                </div>
                <ChevronRight size={16} color="#C4622D" className="flex-shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
