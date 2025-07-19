"use client";

import React, { useState } from 'react'
import PWAInstallPrompt from '@/components/custom/PWA-install-prompt'
import TopHeader from '@/components/custom/TopHeader'
import BottomNavigation from '@/components/custom/BottomNavigation'

export default function Home() {
  const [lostSelected, setLostSelected] = useState(true)
  const lostCount = 0 // replace with real data or state
  const foundCount = 0 // replace with real data or state

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopHeader />

      <main className="flex-1 flex flex-col items-center gap-2 p-4">
        <PWAInstallPrompt />

        {/* Orange Stat Boxes */}
        <div className="w-full flex justify-center bg-orange-300 text-sm p-4 rounded-md gap-15">
          <div className="text-sm text-gray-700">
            <p>Location</p>
            <p>Rescued: --</p>
            <p>Missing: --</p>
          </div>
          <div className="text-sm text-gray-700">
            <p>Overall Missing: --</p>
            <p>Dogs: --</p>
            <p>Cats: --</p>
          </div>
        </div>

        {/* Lost & Found Slider */}
        <div className="relative w-full h-10 rounded-full bg-orange-200 shadow-md">
          <div
            className="absolute w-1/2 h-full rounded-full bg-orange-300 transition-all duration-300 shadow-inner"
            style={{ transform: `translateX(${lostSelected ? '0%' : '100%'})` }}
          />
          <button
            className={`absolute w-1/2 h-full rounded-full font-medium transition-colors duration-300 ${
              lostSelected ? 'text-black font-bold' : 'text-gray-700'
            }`}
            onClick={() => setLostSelected(true)}
          >
            Lost
          </button>
          <button
            className={`absolute w-1/2 h-full right-0 rounded-full font-medium transition-colors duration-300 ${
              lostSelected ? 'text-gray-700' : 'text-black font-bold'
            }`}
            onClick={() => setLostSelected(false)}
          >
            Found
          </button>
        </div>

        {/* Lost Detail Card */}
        <div className="bg-green-100 text-center text-black p-6 w-full rounded-xl shadow-md">
          <p className="text-base">Detail about lost dogs</p>
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}
