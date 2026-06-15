import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#1C1208',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#C4622D',
          fontSize: 22,
          fontWeight: 900,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: -1,
        }}
      >
        E
      </div>
    ),
    { ...size },
  );
}
