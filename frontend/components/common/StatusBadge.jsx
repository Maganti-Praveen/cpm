// Outputs styled labels representing states like overdue, in progress, or approved.
// Maps statuses to color-coded pills.


import { Check } from 'lucide-react';

const statusConfig = {
  'Active': { bg: '#D1FAE5', text: '#15803D' },
  'In Progress': { bg: '#E0F2FE', text: '#0369A1' }, // Premium blue for In Progress
  'Completed': { bg: '#D1FAE5', text: '#15803D' }, // Green for Completed
  'Overdue': { bg: '#FEE2E2', text: '#B91C1C' },
  'Pending': { bg: '#F3F4F6', text: '#374151' },
  'Planning': { bg: '#F3F4F6', text: '#374151' },
  'Draft': { bg: '#F5F3FF', text: '#6D28D9' },
  'Review': { bg: '#F5F3FF', text: '#6D28D9' },
  'In Review': { bg: '#F5F3FF', text: '#6D28D9' },
  'Paid': { bg: '#D1FAE5', text: '#15803D' },
  'Cancelled': { bg: '#F3F4F6', text: '#6B7280' },
  'On Hold': { bg: '#FEF3C7', text: '#92400E' },
  'Rejected': { bg: '#FEE2E2', text: '#991B1B' },
  'Open': { bg: '#E0F2FE', text: '#0369A1' },
  'Resolved': { bg: '#D1FAE5', text: '#15803D' },
  'Replied': { bg: '#D1FAE5', text: '#047857' },
  'High': { bg: '#FEE2E2', text: '#DC2626' },
  'Critical': { bg: '#FFE4E6', text: '#881337' },
  'Medium': { bg: '#FEF3C7', text: '#D97706' },
  'Low': { bg: '#D1FAE5', text: '#059669' },
  'Suspended': { bg: '#FEE2E2', text: '#991B1B' },
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || { bg: '#F3F4F6', text: '#374151' };
  const isCompleted = status === 'Completed' || status === 'Resolved' || status === 'Paid';

  return (
    <span
      className="inline-flex items-center gap-1 justify-center rounded-full font-medium whitespace-nowrap"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        fontSize: '0.6875rem',
        height: '1.375rem',
        padding: '0 0.625rem',
      }}
    >
      {isCompleted && <Check size={11} className="stroke-[3] shrink-0" />}
      {status}
    </span>
  );
}

export default StatusBadge;
