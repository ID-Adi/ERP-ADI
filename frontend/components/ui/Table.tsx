'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TableProps extends HTMLAttributes<HTMLTableElement> {}

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="overflow-x-auto -mx-3">
      <table
        className={cn('w-full text-xs text-left text-gray-700', className)}
        {...props}
      />
    </div>
  );
}

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {}

export function TableHeader({ className, ...props }: TableHeaderProps) {
  return (
    <thead
      className={cn('bg-gray-50 border-b border-gray-200', className)}
      {...props}
    />
  );
}

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

export function TableBody({ className, ...props }: TableBodyProps) {
  return <tbody className={cn('divide-y divide-gray-200', className)} {...props} />;
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
}

export function TableRow({ className, hoverable = true, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        'transition-colors',
        hoverable && 'hover:bg-gray-50',
        className
      )}
      {...props}
    />
  );
}

interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {}

export function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        'px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide',
        className
      )}
      {...props}
    />
  );
}

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {}

export function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn('px-3 py-2 whitespace-nowrap', className)}
      {...props}
    />
  );
}
