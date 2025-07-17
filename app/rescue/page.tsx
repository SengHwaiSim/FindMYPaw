// pages/rescue.tsx
import React from 'react'
import Link from 'next/link'
import TopHeader from '@/components/custom/TopHeader'
import BottomNavigation from '@/components/custom/BottomNavigation'

export default function Rescue() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <TopHeader/>
      
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <p className="mb-4 text-lg">Tap to scan for lost animals nearby</p>
        <button className="px-6 py-3 bg-blue-500 text-white rounded shadow">Scan Now</button>
      </main>

      <BottomNavigation/>
    </div>
  )
}
