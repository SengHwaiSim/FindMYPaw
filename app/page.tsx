// app/page.tsx
import Link from 'next/link'
import PWAInstallPrompt  from '@/components/custom/PWA-install-prompt'


export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center space-y-8 bg-gray-50 p-6">
      <PWAInstallPrompt/>
      <h1 className="text-5xl font-extrabold">Welcome to Pawtect</h1>
      <p className="text-lg text-gray-600">
        Choose where you’d like to go:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
        {[
          { href: '/dashboard', label: 'Dashboard', desc: 'View your stats & reports' },
          { href: '/detect',    label: 'Detect',    desc: 'Scan for missing pets' },
          { href: '/rescue',    label: 'Rescue',    desc: 'Help reunite pets' },
        ].map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="block p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-2">{page.label} &rarr;</h2>
            <p className="text-gray-500">{page.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
