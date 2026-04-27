import Image from 'next/image'
import type { ReactNode } from 'react'

interface SocialChannel {
  label: string
  href: string
  accentClass: string
  hoverClass: string
  icon: ReactNode
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.7 31.7 0 0 0 24 12a31.7 31.7 0 0 0-.5-5.8ZM9.6 15.7V8.3l6.2 3.7-6.2 3.7Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 1.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9a3.7 3.7 0 0 0-3.7-3.7h-9Zm9.8 1.4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 6.8A5.2 5.2 0 1 1 6.8 12 5.2 5.2 0 0 1 12 6.8Zm0 1.8A3.4 3.4 0 1 0 15.4 12 3.4 3.4 0 0 0 12 8.6Z" />
    </svg>
  )
}

function ThreadsIcon() {
  return (
    <Image
      src="/social/threads.svg"
      alt=""
      width={20}
      height={20}
      className="h-5 w-5 object-contain"
      aria-hidden="true"
    />
  )
}

const CHANNELS: SocialChannel[] = [
  {
    label: '유튜브',
    href: 'https://www.youtube.com/@saju_roa',
    accentClass: 'text-red-600',
    hoverClass: 'hover:border-red-200 hover:bg-red-50',
    icon: <YoutubeIcon />,
  },
  {
    label: '인스타그램',
    href: 'https://www.instagram.com/saju.roa/',
    accentClass: 'text-pink-600',
    hoverClass: 'hover:border-pink-200 hover:bg-pink-50',
    icon: <InstagramIcon />,
  },
  {
    label: '쓰레드',
    href: 'https://www.threads.com/@saju.roa',
    accentClass: 'text-gray-900',
    hoverClass: 'hover:border-gray-300 hover:bg-gray-100',
    icon: <ThreadsIcon />,
  },
]

export default function SocialChannelsFooter() {
  return (
    <section className="flex flex-col items-center gap-3 rounded-[1.75rem] border border-gray-100 bg-[linear-gradient(135deg,_#fffefe_0%,_#fff8fb_45%,_#f8fafc_100%)] px-6 py-5 shadow-sm">
      <p className="text-xs font-medium tracking-[0.24em] text-gray-400">FOLLOW SAJU ROA</p>
      <div className="flex items-center gap-3">
        {CHANNELS.map((channel) => (
          <a
            key={channel.label}
            href={channel.href}
            target="_blank"
            rel="noreferrer"
            title={channel.label}
            aria-label={channel.label}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 ${channel.accentClass} ${channel.hoverClass}`}
          >
            {channel.icon}
          </a>
        ))}
      </div>
    </section>
  )
}
