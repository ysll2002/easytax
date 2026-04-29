'use client';
import Link from 'next/link';

export default function Success() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-green-100 text-center">
        
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Payment Successful!</h2>
        
        <div className="bg-green-50 p-4 rounded-lg mb-6 text-left">
          <h3 className="font-bold text-green-800 mb-2">Next Steps:</h3>
          <ul className="list-disc list-inside text-sm text-green-700 space-y-2">
            <li>Your Self Assessment has been queued for submission.</li>
            <li>We will email you the official HMRC receipt within 24 hours.</li>
            <li>A copy of your return is available in your dashboard.</li>
          </ul>
        </div>

        <p className="text-gray-500 text-sm mb-8">
          Order #TAX-2026-8842 • {new Date().toLocaleDateString()}
        </p>

        <Link href="/dashboard" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
