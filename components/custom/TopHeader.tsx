// components/custom/Header.tsx
import React from 'react'
import Image from 'next/image'

export default function TopHeader() {
  return (
    <header className="flex items-center justify-center p-4 border-b">
      <Image src="/apple-icon.png" alt="Paw Icon" width={30} height={30} className="mr-2" />
      <h1 className="text-gray-700 text-lg font-bold">FindMYPaw</h1>
    </header>
  )
}
