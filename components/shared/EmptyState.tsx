// ==============================================
// components/shared/EmptyState.tsx - Reusable Empty State Component
// ==============================================

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  icon?: LucideIcon
  show?: boolean // For permission-based rendering
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actions?: EmptyStateAction[]
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions = [],
  className = ''
}: EmptyStateProps) {
  const visibleActions = actions.filter(action => action.show !== false)

  return (
    <Card className={className}>
      <CardContent className="p-6 xs:p-8 sm:p-10 md:p-12 text-center">
        <Icon className="h-10 w-10 xs:h-12 xs:w-12 text-gray-400 mx-auto mb-3 xs:mb-4 flex-shrink-0" />
        <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-1.5 xs:mb-2 px-2">{title}</h3>
        <p className="text-xs xs:text-sm sm:text-base text-gray-600 mb-3 xs:mb-4 max-w-md mx-auto leading-snug xs:leading-normal px-4">{description}</p>

        {visibleActions.length > 0 && (
          <div className="flex gap-1.5 xs:gap-2 justify-center flex-wrap px-2">
            {visibleActions.map((action, index) => {
              const ActionIcon = action.icon

              return (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  className={cn(
                    "h-9 xs:h-10 text-sm xs:text-base",
                    action.variant === 'default' || !action.variant ? 'bg-orange-600 hover:bg-orange-700' : ''
                  )}
                  onClick={action.onClick}
                  asChild={!!action.href}
                >
                  {action.href ? (
                    <Link href={action.href}>
                      {ActionIcon && <ActionIcon className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />}
                      <span>{action.label}</span>
                    </Link>
                  ) : (
                    <>
                      {ActionIcon && <ActionIcon className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />}
                      <span>{action.label}</span>
                    </>
                  )}
                </Button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}