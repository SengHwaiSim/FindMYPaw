import React from 'react'
import PWAInstallPrompt from '@/components/custom/PWA-install-prompt'
import TopHeader from '@/components/custom/TopHeader'
import BottomNavigation from '@/components/custom/BottomNavigation'

export default function Home() {
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

        {/* Lost & Found Buttons */}
        <div className="flex gap-2">
          <button className="bg-orange-300 text-gray-700 px-6 py-2 rounded-full font-medium shadow">
            Lost
          </button>
          <button className="bg-orange-200 text-black px-6 py-2 rounded-full font-medium shadow">
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
