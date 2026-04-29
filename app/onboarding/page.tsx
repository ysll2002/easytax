'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const router = useRouter();
  const [gatewayId, setGatewayId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatewayId || !password) return;

    setLoading(true);
    setStatusText('Verifying credentials...');
    
    // Simulation of API calls
    setTimeout(() => setStatusText('Connecting to HMRC securely...'), 1000);
    setTimeout(() => setStatusText('Fetching income records (P60, P45)...'), 2500);
    setTimeout(() => setStatusText('Calculating expenses...'), 4000);
    
    setTimeout(() => {
      router.push('/actions');
    }, 5500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">Please wait</h2>
        <p className="text-gray-600 mt-2">{statusText}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Link HMRC Gateway
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We use your Government Gateway ID to fetch your tax records securely.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleConnect}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="gateway-id" className="sr-only">Gateway User ID</label>
              <input
                id="gateway-id"
                name="gateway-id"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Gateway User ID (e.g. 1234567890)"
                value={gatewayId}
                onChange={(e) => setGatewayId(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Connect & Fetch Data
            </button>
          </div>
          
          <div className="text-xs text-center text-gray-500 mt-4">
            <p>Your data is encrypted and never stored permanently.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
