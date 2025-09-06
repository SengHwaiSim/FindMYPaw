// components/custom/BottomNavigation.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNavigation() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="flex justify-around border-t py-6 mb-6">
      <Link
        href="/home"
        className={`text-base  ${
          isActive('/home') ? 'text-orange-500 font-semibold ' : 'text-gray-700 hover:text-blue-500 font-medium'
        }`}
      >
        Home
      </Link>
      <Link
        href="/rescue"
        className={`text-base  ${
          isActive('/rescue') ? 'text-orange-500 font-semibold ' : 'text-gray-700 hover:text-blue-500 font-medium'
        }`}
      >
        Rescue
      </Link>
      <Link
        href="/account"
        className={`text-base  ${
          isActive('/account') ? 'text-orange-500 font-semibold ' : 'text-gray-700 hover:text-blue-500 font-medium'
        }`}
      >
        Account
      </Link>
    </nav>
  )
}
