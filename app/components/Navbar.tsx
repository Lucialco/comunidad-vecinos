'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'

const LINKS = [
  { href: '/', label: 'Inicio', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin', label: 'Administrador', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/presidente', label: 'Presidente', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-3 min-w-0" onClick={() => setOpen(false)}>
          <Image
            src="/logo-parcela8.png"
            alt="Parcela 8"
            width={36}
            height={36}
            className="flex-shrink-0 rounded"
          />
          <span className="font-bold text-[#C9A227] text-base sm:text-lg tracking-wide truncate">
            Parcela 8
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link key={link.href} href={link.href}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors
                  ${active
                    ? 'bg-[#FBF3DA] text-[#C9A227]'
                    : 'text-stone-600 hover:text-[#C9A227] hover:bg-[#FBF3DA]'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {link.icon.split(' M').map((d, i) => (
                    <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={i === 0 ? d : `M${d}`} />
                  ))}
                </svg>
                {link.label}
              </Link>
            )
          })}

          {/* Session info */}
          {session?.user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-stone-200">
              <div className="text-right hidden md:block">
                <p className="text-xs font-semibold text-gray-800 leading-none">{session.user.name}</p>
                <p className="text-xs text-[#C9A227] leading-none mt-0.5">{session.user.role}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg text-stone-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Cerrar sesión"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden lg:inline">Salir</span>
              </button>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="sm:hidden p-2 rounded-lg text-stone-600 hover:bg-[#FBF3DA] hover:text-[#C9A227] transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-stone-100 bg-white shadow-lg">
          {LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link key={link.href} href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium border-b border-stone-50 transition-colors
                  ${active
                    ? 'bg-[#FBF3DA] text-[#C9A227] border-l-4 border-l-[#C9A227]'
                    : 'text-stone-700 hover:bg-[#FBF3DA] hover:text-[#C9A227]'}`}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {link.icon.split(' M').map((d, i) => (
                    <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={i === 0 ? d : `M${d}`} />
                  ))}
                </svg>
                {link.label}
              </Link>
            )
          })}

          {session?.user && (
            <div className="px-4 py-3 border-t border-stone-100">
              <p className="text-xs text-stone-500 mb-1">{session.user.name} · <span className="text-[#C9A227]">{session.user.role}</span></p>
              <button
                onClick={() => { setOpen(false); signOut({ callbackUrl: '/login' }) }}
                className="text-sm text-red-600 font-medium hover:text-red-800"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
