// app/page.tsx
import PWAInstallPrompt  from '@/components/custom/PWA-install-prompt'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const lostCount = 0 // replace with real data or state
  const foundCount = 0 // replace with real data or state
    
  return (
    <div className="flex flex-col h-screen bg-white ">
      {/* Header */}
      <header className="flex items-center justify-center p-4 border-b">
        <Image src="/apple-icon.png" alt="Paw Icon" width={30} height={30} className="mr-2" />
        <h1 className="text-gray-700 text-lg font-bold">FindMYPaw</h1>
      </header>

      {/* Statistics Dashboard */}
      <main className="flex-1 flex items-center justify-around px-4 py-8">
        <PWAInstallPrompt/>
        <div className="flex flex-col items-center justify-center p-6 rounded-lg shadow-md w-40 bg-red-100">
          <h2 className="text-lg font-medium mb-2">Lost</h2>
          <p className="text-2xl font-bold">{lostCount}</p>
        </div>
        <div className="flex flex-col items-center justify-center p-6 rounded-lg shadow-md w-40 bg-green-100">
          <h2 className="text-lg font-medium mb-2">Found</h2>
          <p className="text-2xl font-bold">{foundCount}</p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex justify-around border-t py-4">
        <Link href="/" className="text-base text-blue-500 font-semibold">Home</Link>
        <Link href="/rescue" className="text-base text-gray-700 hover:text-blue-500">Rescue</Link>
        <Link href="/account" className="text-base text-gray-700 hover:text-blue-500">Account</Link>
      </nav>
    </div>
  )
}
