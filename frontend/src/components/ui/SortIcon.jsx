import { ArrowUp, ArrowDown, Filter } from 'lucide-react';

export default function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column) {
    return <Filter size={12} className="sort-icon opacity-20" />;
  }
  return sortConfig.direction === 'asc' ? (
    <ArrowUp size={12} className="text-primary" />
  ) : (
    <ArrowDown size={12} className="text-primary" />
  );
}
