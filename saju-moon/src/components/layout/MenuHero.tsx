import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type HeroButtonVariant = 'default' | 'ghost'
type HeroButtonSize = 'sm' | 'lg'

export interface MenuHeroAction {
  href: string
  label: string
  variant?: HeroButtonVariant
  size?: HeroButtonSize
  className?: string
}

export interface MenuHeroPalette {
  borderClass: string
  gradientClass: string
  eyebrowClass: string
}

interface MenuHeroProps {
  eyebrow: string
  title: string
  description: string
  palette?: MenuHeroPalette
  titleActions?: MenuHeroAction[]
  actions?: MenuHeroAction[]
  children?: ReactNode
  className?: string
}

export default function MenuHero({
  eyebrow,
  title,
  description,
  titleActions,
  actions,
  children,
  className,
}: MenuHeroProps) {
  return (
    <section
      className={cn('overflow-hidden rounded-2xl border p-8 sm:p-10', className)}
      style={{ background: '#FBF7EE', borderColor: 'rgba(30,45,77,0.09)' }}
    >
      <p
        className="text-sm font-medium uppercase tracking-[0.24em]"
        style={{ color: '#C4A24E', fontFamily: 'var(--font-cormorant-garamond), serif' }}
      >
        {eyebrow}
      </p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: '#1E2D4D', fontFamily: 'var(--font-nanum-myeongjo), serif' }}
        >
          {title}
        </h1>
        {titleActions && titleActions.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
            {titleActions.map((action) => (
              <Link
                key={`title-${action.href}-${action.label}`}
                href={action.href}
                scroll={false}
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition',
                  action.className,
                )}
                style={
                  !action.className
                    ? { background: '#1E2D4D', color: '#F6EFE3' }
                    : undefined
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <p
        className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 sm:text-base"
        style={{ color: '#4a5673' }}
      >
        {description}
      </p>

      {children}

      {actions && actions.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              scroll={false}
              className={cn(
                'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition hover:opacity-80',
                action.className,
              )}
              style={
                !action.className
                  ? action.variant === 'ghost'
                    ? { border: '1px solid rgba(30,45,77,0.22)', color: '#4a5673' }
                    : { background: '#1E2D4D', color: '#F6EFE3' }
                  : undefined
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
