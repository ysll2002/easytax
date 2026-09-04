import { ImageResponse } from 'next/og';

// Social preview card.
//
// app/layout.tsx pointed openGraph.images and twitter.images at /og-image.png,
// which does not exist in public/ — it returned the 404 page. Every share of
// every URL on the site (and Google's own preview surfaces) therefore rendered
// with a broken image. Generating it here means the asset can never fall out
// of the repo again, and it renders for every route that does not override it.

export const alt = 'EasyTax — MTD ITSA software for UK sole traders and limited companies';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#1C1208',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              backgroundColor: '#C4622D',
              display: 'flex',
            }}
          />
          <div style={{ color: '#C4622D', fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
            EasyTax
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              color: '#FDFCF8',
              fontSize: 74,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: -2,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex' }}>MTD ITSA, Self Assessment,</div>
            <div style={{ display: 'flex' }}>
              VAT and CT600 —&nbsp;<span style={{ color: '#6B8E6E' }}>filed to HMRC.</span>
            </div>
          </div>
          <div style={{ color: '#B8ADA1', fontSize: 30, marginTop: 24, display: 'flex' }}>
            £20 + VAT per submission. No monthly subscription.
          </div>
        </div>

        {/* Footer strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {['Built on HMRC’s MTD API', 'No card to sign up', 'Finance Panda Limited'].map(label => (
            <div
              key={label}
              style={{
                display: 'flex',
                color: '#DDD5C8',
                fontSize: 22,
                padding: '10px 22px',
                borderRadius: 999,
                border: '1px solid #3D3025',
                backgroundColor: '#2E2418',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
