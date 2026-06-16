'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink, type PlaidLinkOnSuccessMetadata } from 'react-plaid-link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

type Props = {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  redirectAfter?: string;
};

export default function PlaidLinkButton({ className, style, children, redirectAfter = '/dashboard/individual' }: Props) {
  const router = useRouter();
  const t = useTranslations('dashboard.banking');
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/plaid/create-link-token', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.link_token) setLinkToken(data.link_token);
        else setError(data.error ?? 'link_token_unavailable');
      })
      .catch(() => !cancelled && setError('network_error'));
    return () => { cancelled = true; };
  }, []);

  const onSuccess = useCallback(
    async (public_token: string, metadata: PlaidLinkOnSuccessMetadata) => {
      setSubmitting(true);
      try {
        const res = await fetch('/api/plaid/exchange-token', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ public_token, institution: metadata.institution }),
        });
        if (!res.ok) throw new Error(`exchange_${res.status}`);
        router.push(redirectAfter);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'exchange_failed');
        setSubmitting(false);
      }
    },
    [router, redirectAfter],
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  const disabled = !linkToken || !ready || submitting;

  return (
    <>
      <button
        type="button"
        onClick={() => open()}
        disabled={disabled}
        className={className}
        style={{ ...style, opacity: disabled ? 0.6 : 1, cursor: disabled ? 'wait' : 'pointer' }}
      >
        {submitting ? t('connecting') : children}
      </button>
      {error && (
        <p className="text-xs text-center mt-3" style={{ color: '#C46262' }}>
          {error === 'link_token_unavailable' || error === 'link_token_failed'
            ? t('errorRetry')
            : error === 'network_error'
            ? t('errorNetwork')
            : t('errorGeneric', { error })}
        </p>
      )}
    </>
  );
}
