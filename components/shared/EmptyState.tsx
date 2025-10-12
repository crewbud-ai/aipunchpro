// ==============================================
// components/shared/EmptyState.tsx - Reusable Empty State Component
// ==============================================

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

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
      <CardContent className="p-12 text-center">
        <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4 max-w-md mx-auto">{description}</p>
        
        {visibleActions.length > 0 && (
          <div className="flex gap-2 justify-center flex-wrap">
            {visibleActions.map((action, index) => {
              const ActionIcon = action.icon
              
              return (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  className={action.variant === 'default' || !action.variant ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  onClick={action.onClick}
                  asChild={!!action.href}
                >
                  {action.href ? (
                    <Link href={action.href}>
                      {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
                      {action.label}
                    </Link>
                  ) : (
                    <>
                      {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
                      {action.label}
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