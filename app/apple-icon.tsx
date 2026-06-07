import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#1C1208',
          borderRadius: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#C4622D',
          fontSize: 120,
          fontWeight: 900,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: -4,
        }}
      >
        E
      </div>
    ),
    { ...size },
  );
}
