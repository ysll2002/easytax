'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Payment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API call to Stripe
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate success
    router.push('/payment/success');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        {/* Header */}
        <div className="text-center">
          <Link href="/dashboard" className="text-blue-600 font-bold text-2xl mb-2 inline-block">EasyTax</Link>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Secure Checkout</h2>
          <p className="mt-2 text-sm text-gray-600">
            File your 2025/26 Self Assessment securely.
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 font-medium">Tax Filing Service</span>
            <span className="text-gray-900 font-bold">£20.00</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>VAT (20%)</span>
            <span>£4.00</span>
          </div>
          <div className="border-t border-gray-200 my-2 pt-2 flex justify-between items-center text-lg">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-blue-600">£24.00</span>
          </div>
        </div>

        {/* Payment Form */}
        <form className="mt-8 space-y-6" onSubmit={handlePayment}>
          <div className="space-y-4">
            
            {/* Card Details (Mock) */}
            <div>
              <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <div className="relative">
                <input
                  id="card-number"
                  name="card-number"
                  type="text"
                  required
                  placeholder="0000 0000 0000 0000"
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  id="expiry"
                  name="expiry"
                  type="text"
                  required
                  placeholder="MM / YY"
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="w-1/2">
                <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                <input
                  id="cvc"
                  name="cvc"
                  type="text"
                  required
                  placeholder="123"
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Jane Doe"
                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Pay £24.00 & File Return'
            )}
          </button>
          
          <div className="flex justify-center items-center gap-2 text-xs text-gray-400 mt-4">
            <span>Powered by Stripe</span>
            <span className="h-3 w-px bg-gray-300"></span>
            <span>Secure SSL Encryption</span>
          </div>
        </form>
      </div>
    </div>
  );
}
