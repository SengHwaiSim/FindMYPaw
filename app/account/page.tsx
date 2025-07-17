// pages/account.tsx
import React from 'react'
import Link from 'next/link'
import TopHeader from '@/components/custom/TopHeader'
import BottomNavigation from '@/components/custom/BottomNavigation'

export default function Account() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <TopHeader/>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <p className="mb-2">Username: <strong>user123</strong></p>
        <p className="mb-4">Email: user@example.com</p>
        <button className="px-4 py-2 border rounded text-red-500">Log out</button>
      </main>
      <BottomNavigation/>
    </div>
  )
}
