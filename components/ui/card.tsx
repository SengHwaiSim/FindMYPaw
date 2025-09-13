import React from 'react';
import { cn } from '@/lib/utils'; // We'll import this if it exists, or fallback if not

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('align-middle rounded-lg border bold bg-card text-card-foreground shadow-sm', className)} {...props} />;
  }
);
Card.displayName = 'Card';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('p-3', className)} {...props} />;
  }
);
CardContent.displayName = 'CardContent';

export { Card, CardContent };
