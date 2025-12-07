'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-shimmer rounded', className)} />
  );
}

export function SkeletonText({ className, lines = 1 }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 animate-shimmer rounded',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white rounded-lg shadow border border-gray-200 p-6', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 w-24 animate-shimmer rounded" />
          <div className="h-8 w-32 animate-shimmer rounded" />
        </div>
        <div className="h-12 w-12 animate-shimmer rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 animate-shimmer rounded" />
        <div className="h-4 w-20 animate-shimmer rounded" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 animate-shimmer rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="px-6 py-4 border-b border-gray-100 flex gap-4 items-center"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={cn(
                'h-4 animate-shimmer rounded flex-1',
                colIndex === 0 && 'w-20',
                colIndex === columns - 1 && 'w-24'
              )}
              style={{ animationDelay: `${(rowIndex * columns + colIndex) * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 animate-shimmer rounded" />
          <div className="h-10 animate-shimmer rounded-lg" />
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-4">
        <div className="h-10 w-24 animate-shimmer rounded-lg" />
        <div className="h-10 w-24 animate-shimmer rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('animate-shimmer rounded-full', sizes[size])} />
  );
}
