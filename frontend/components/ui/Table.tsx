
'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * DataTable Container - wraps table with fixed height and scrollable body
 * Usage:
 * <DataTableContainer>
 *   <DataTable>...</DataTable>
 * </DataTableContainer>
 */
interface DataTableContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Fixed height for the container - defaults to fill available space */
  height?: string;
}

export function DataTableContainer({
  className,
  height = 'calc(100vh - 14rem)',
  style,
  ...props
}: DataTableContainerProps) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden border border-surface-200 rounded-lg bg-white',
        className
      )}
      style={{ height, ...style }}
      {...props}
    />
  );
}

/**
 * DataTable - Full width table with sticky header
 */
interface DataTableProps extends HTMLAttributes<HTMLTableElement> { }

export function DataTable({ className, ...props }: DataTableProps) {
  return (
    <div className="h-full flex flex-col">
      <table
        className={cn('w-full text-sm text-left border-collapse', className)}
        {...props}
      />
    </div>
  );
}

/**
 * Standard Table (legacy, for simpler cases)
 */
interface TableProps extends HTMLAttributes<HTMLTableElement> { }

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn('w-full text-xs text-left text-gray-700', className)}
        {...props}
      />
    </div>
  );
}

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> { }

export function TableHeader({ className, ...props }: TableHeaderProps) {
  return (
    <thead
      className={cn(
        'bg-warmgray-800 text-white text-xs uppercase sticky top-0 z-10',
        className
      )}
      {...props}
    />
  );
}

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> { }

export function TableBody({ className, ...props }: TableBodyProps) {
  return (
    <tbody
      className={cn('divide-y divide-surface-200 bg-white', className)}
      {...props}
    />
  );
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
  striped?: boolean;
  index?: number;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(({
  className,
  hoverable = true,
  striped = false,
  index = 0,
  ...props
}, ref) => {
  return (
    <tr
      ref={ref}
      className={cn(
        'transition-colors',
        hoverable && 'hover:bg-primary-50 cursor-pointer',
        striped && (index % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'),
        className
      )}
      {...props}
    />
  );
});
TableRow.displayName = "TableRow";

interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
}

export function TableHead({ className, sortable, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap',
        sortable && 'cursor-pointer hover:bg-warmgray-700',
        className
      )}
      {...props}
    />
  );
}

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  colSpan?: number;
}

export function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn('px-4 py-2.5 whitespace-nowrap', className)}
      {...props}
    />
  );
}

/**
 * Scrollable Table Body Wrapper - for fixed header with scrollable content
 */
interface ScrollableTableBodyProps extends HTMLAttributes<HTMLDivElement> { }

export function ScrollableTableBody({ className, children, ...props }: ScrollableTableBodyProps) {
  return (
    <div
      className={cn('flex-1 overflow-y-auto overflow-x-hidden', className)}
      {...props}
    >
      <table className="w-full text-sm text-left border-collapse">
        {children}
      </table>
    </div>
  );
}
