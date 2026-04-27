import Link from 'next/link'
import type { ReactNode } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type HeroButtonVariant = VariantProps<typeof buttonVariants>['variant']
type HeroButtonSize = VariantProps<typeof buttonVariants>['size']

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
  palette: MenuHeroPalette
  titleActions?: MenuHeroAction[]
  actions?: MenuHeroAction[]
  children?: ReactNode
  className?: string
}

export default function MenuHero({
  eyebrow,
  title,
  description,
  palette,
  titleActions,
  actions,
  children,
  className,
}: MenuHeroProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-[2rem] border p-8 sm:p-10',
        palette.borderClass,
        palette.gradientClass,
        className,
      )}
    >
      <p className={cn('text-sm font-medium uppercase tracking-[0.24em]', palette.eyebrowClass)}>
        {eyebrow}
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{title}</h1>
        {titleActions && titleActions.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
            {titleActions.map((action) => (
              <Link
                key={`title-${action.href}-${action.label}`}
                href={action.href}
                scroll={false}
                className={cn(
                  buttonVariants({ variant: action.variant, size: action.size ?? 'sm' }),
                  action.className,
                )}
              >
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </div>
      <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-gray-600 sm:text-base">
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
                buttonVariants({ variant: action.variant, size: action.size ?? 'sm' }),
                action.className,
              )}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
