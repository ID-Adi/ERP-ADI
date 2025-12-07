'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, description, headerAction, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-surface-300/50 p-6 transition-all duration-200',
          className
        )}
        {...props}
      >
        {(title || description || headerAction) && (
          <div className="flex items-center justify-between mb-4 -mx-6 -mt-6 px-6 py-4 border-b border-surface-300/50 bg-surface-50/50 rounded-t-xl">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-warmgray-900">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-warmgray-500">{description}</p>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
