// pages/account.tsx
import React from 'react'
import Link from 'next/link'

export default function Account() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="p-4 border-b text-center font-semibold text-xl">Account</header>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <p className="mb-2">Username: <strong>user123</strong></p>
        <p className="mb-4">Email: user@example.com</p>
        <button className="px-4 py-2 border rounded text-red-500">Log out</button>
      </main>
      <nav className="flex justify-around border-t py-4">
        <Link href="/" className="text-base text-gray-700 hover:text-blue-500">Home</Link>
        <Link href="/rescue" className="text-base text-gray-700 hover:text-blue-500">Rescue</Link>
        <Link href="/account" className="text-base text-blue-500 font-semibold">Account</Link>
      </nav>
    </div>
  )
}
