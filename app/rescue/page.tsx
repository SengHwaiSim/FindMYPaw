// pages/rescue.tsx
import React from 'react'
import Link from 'next/link'

export default function Rescue() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="p-4 border-b text-center font-semibold text-xl">Rescue</header>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <p className="mb-4 text-lg">Tap to scan for lost animals nearby</p>
        <button className="px-6 py-3 bg-blue-500 text-white rounded shadow">Scan Now</button>
      </main>
      <nav className="flex justify-around border-t py-4">
        <Link href="/" className="text-base text-gray-700 hover:text-blue-500">Home</Link>
        <Link href="/rescue" className="text-base text-blue-500 font-semibold">Rescue</Link>
        <Link href="/account" className="text-base text-gray-700 hover:text-blue-500">Account</Link>
      </nav>
    </div>
  )
}
