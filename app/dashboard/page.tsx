'use client';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">EasyTax</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 text-sm mr-4">User: 1234567890</span>
              <button className="text-gray-500 hover:text-gray-700 text-sm">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Tax Year 2025/2026 Summary
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Data fetched from HMRC on {new Date().toLocaleDateString()}.
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Total Income (PAYE)</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">£45,000.00</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Self-Employment Income</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">£12,000.00</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Allowable Expenses</dt>
                  <dd className="mt-1 text-2xl font-semibold text-red-600">-£3,500.00</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Tax Already Paid</dt>
                  <dd className="mt-1 text-2xl font-semibold text-green-600">£6,500.00</dd>
                </div>
              </dl>
            </div>
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Tax Due</dt>
                  <dd className="mt-1 text-3xl font-bold text-gray-900">£2,450.00</dd>
                  <p className="text-xs text-red-500 mt-1">Deadline: 31 Jan 2027</p>
                </div>
                <div>
                   <Link href="/payment" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                     File & Pay Now (£20)
                   </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-blue-400">ℹ️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Based on your expenses, we found you could save an additional <strong>£250</strong> by claiming 'Use of Home as Office'.
                  <Link href="/expenses" className="font-medium underline hover:text-blue-600 ml-1">Review expenses &rarr;</Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
