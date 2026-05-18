export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.5rem' }}>
        Settings
      </h1>
      <p style={{ color: '#9A8F83', marginBottom: '2rem' }}>Manage your account preferences</p>

      <div className="space-y-4">
        {[
          { title: 'Email notifications', desc: 'Receive reminders before tax deadlines', enabled: true },
          { title: 'Two-factor authentication', desc: 'Add an extra layer of security', enabled: false },
          { title: 'Data sharing', desc: 'Help improve EasyTax with anonymous usage data', enabled: false },
        ].map(setting => (
          <div key={setting.title} className="flex items-center justify-between p-5 rounded-2xl" style={{ backgroundColor: '#F0EBE1', border: '1px solid #DDD5C8' }}>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#1C1208' }}>{setting.title}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>{setting.desc}</p>
            </div>
            <div style={{ width: '44px', height: '24px', borderRadius: '12px', backgroundColor: setting.enabled ? '#C4622D' : '#DDD5C8', flexShrink: 0, cursor: 'pointer', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '3px', left: setting.enabled ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#FDFCF8', transition: 'left 0.2s' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
