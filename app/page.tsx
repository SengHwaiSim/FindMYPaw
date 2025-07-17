// app/page.tsx
import PWAInstallPrompt  from '@/components/custom/PWA-install-prompt'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import BottomNavigation from '@/components/custom/BottomNavigation'
import HeaderPages from '@/components/custom/TopHeader'
import TopHeader from '@/components/custom/TopHeader'

export default function Home() {
  const lostCount = 0 // replace with real data or state
  const foundCount = 0 // replace with real data or state
    
  return (
    <div className="flex flex-col h-screen bg-white ">
      {/* Header */}
      <TopHeader/>

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
      <BottomNavigation/>
    </div>
  )
}
