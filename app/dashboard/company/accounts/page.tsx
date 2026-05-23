import Link from 'next/link';

type Account = { code: string; name: string; description: string };
type Group = { type: string; range: string; color: string; bg: string; accounts: Account[] };

const COA: Group[] = [
  {
    type: 'Assets', range: '1000–1999', color: '#6B8E6E', bg: '#E2EDE2',
    accounts: [
      { code: '1000', name: 'Bank Account',          description: 'Primary business current account' },
      { code: '1100', name: 'Accounts Receivable',   description: 'Amounts owed by customers (debtors)' },
      { code: '1200', name: 'Prepayments',           description: 'Expenses paid in advance' },
      { code: '1300', name: 'VAT Recoverable',       description: 'Input VAT reclaimable from HMRC' },
      { code: '1500', name: 'Fixed Assets',          description: 'Equipment, computers, and other long-term assets' },
      { code: '1510', name: 'Accumulated Depreciation', description: 'Depreciation charged against fixed assets' },
    ],
  },
  {
    type: 'Liabilities', range: '2000–2999', color: '#C4622D', bg: '#F5E4D8',
    accounts: [
      { code: '2000', name: 'Accounts Payable',      description: 'Amounts owed to suppliers (creditors)' },
      { code: '2100', name: 'VAT Liability',         description: 'Output VAT collected, payable to HMRC' },
      { code: '2200', name: 'Corporation Tax',       description: 'Corporation Tax payable to HMRC' },
      { code: '2300', name: "Director's Loan",       description: 'Amounts owed to or from the director' },
      { code: '2400', name: 'PAYE & NIC Payable',   description: 'PAYE and National Insurance due to HMRC' },
      { code: '2500', name: 'Accruals',              description: 'Expenses incurred but not yet invoiced' },
    ],
  },
  {
    type: 'Equity', range: '3000–3999', color: '#7C3AED', bg: '#F5F0FF',
    accounts: [
      { code: '3000', name: 'Share Capital',         description: 'Shares issued to shareholders' },
      { code: '3100', name: 'Retained Earnings',     description: 'Cumulative profits retained in the business' },
      { code: '3200', name: 'Dividends Paid',        description: 'Dividends distributed to shareholders' },
    ],
  },
  {
    type: 'Revenue', range: '4000–4999', color: '#059669', bg: '#ECFDF5',
    accounts: [
      { code: '4000', name: 'Sales Revenue',         description: 'Income from primary business activity' },
      { code: '4100', name: 'Consulting Income',     description: 'Fees from consulting or professional services' },
      { code: '4200', name: 'Other Income',          description: 'Interest received, grants, and miscellaneous income' },
    ],
  },
  {
    type: 'Expenses', range: '5000–5999', color: '#9A8F83', bg: '#F0EBE1',
    accounts: [
      { code: '5000', name: 'Cost of Sales',         description: 'Direct costs attributable to revenue' },
      { code: '5100', name: 'Salaries & Wages',      description: 'Employee and director payroll costs' },
      { code: '5200', name: 'Travel & Subsistence',  description: 'Business travel, accommodation, and meals' },
      { code: '5300', name: 'IT & Software',         description: 'Software subscriptions, hosting, and equipment' },
      { code: '5400', name: 'Professional Services', description: 'Legal, accounting, and consulting fees' },
      { code: '5500', name: 'Office & Admin',        description: 'Rent, utilities, stationery, and office costs' },
      { code: '5600', name: 'Marketing & Advertising', description: 'Paid media, PR, and brand costs' },
      { code: '5700', name: 'Bank & Finance Charges', description: 'Bank fees, payment processing, interest paid' },
      { code: '5800', name: 'Insurance',             description: 'Business insurance premiums' },
      { code: '5900', name: 'Other Expenses',        description: 'Allowable expenses not classified above' },
      { code: '5950', name: 'Depreciation',          description: 'Depreciation charged on fixed assets' },
    ],
  },
];

export default function ChartOfAccountsPage() {
  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <Link href="/dashboard/company" className="text-sm mb-4 inline-block" style={{ color: '#9A8F83', textDecoration: 'none' }}>← Company Tax</Link>

      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-display), Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.25rem' }}>
          Chart of Accounts
        </h1>
        <p style={{ color: '#9A8F83', fontSize: '0.9rem' }}>Standard UK SME double-entry account structure. Used as the basis for your Balance Sheet and P&amp;L.</p>
      </div>

      <div className="space-y-6">
        {COA.map(group => (
          <div key={group.type} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2DA' }}>
            {/* Group header */}
            <div className="flex items-center justify-between px-5 py-3" style={{ backgroundColor: group.bg }}>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                <span className="font-bold text-sm" style={{ color: group.color }}>{group.type}</span>
              </div>
              <span className="text-xs font-mono" style={{ color: group.color, opacity: 0.7 }}>{group.range}</span>
            </div>

            {/* Accounts */}
            <div>
              {group.accounts.map((acct, i) => (
                <div
                  key={acct.code}
                  className="flex items-start gap-4 px-5 py-3"
                  style={{
                    borderTop: i > 0 ? '1px solid #F0EBE1' : undefined,
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <span className="font-mono text-xs flex-shrink-0 mt-0.5 w-10" style={{ color: '#9A8F83' }}>{acct.code}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#1C1208' }}>{acct.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9A8F83' }}>{acct.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs mt-8 text-center" style={{ color: '#BDB5AA' }}>
        Standard UK SME Chart of Accounts · Based on FRS 102 Small Companies Regime
      </p>
    </div>
  );
}
