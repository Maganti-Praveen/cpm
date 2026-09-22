import { Plus } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';

// Lists core shortcut destinations for administrator navigation links
const actions = [
  { label: 'New Project', key: 'project', perm: 'projects' },
  { label: 'Add Client', key: 'client', perm: 'clients' },
  { label: 'Create Invoice', key: 'invoice', perm: 'invoices' },
  { label: 'New Task', key: 'task', perm: 'tasks' },
];

function QuickActions({ onActionClick }) {
  const { user } = useSelector((state) => state.auth);

  const userPermissions = useMemo(() => {
    let perms = {};
    if (!user || user.role !== 'ADMIN') return perms;
    if (user.isSuperAdmin === true) return null; // super admin has all

    if (typeof user.permissions === 'string') {
      try {
        perms = JSON.parse(user.permissions);
      } catch (_) {
        perms = {};
      }
    } else if (user.permissions && typeof user.permissions === 'object') {
      perms = user.permissions;
    }
    return perms;
  }, [user]);

  const isActionDisabled = (permKey) => {
    if (!user) return true;
    if (user.role !== 'ADMIN') return true;
    if (user.isSuperAdmin === true) return false;

    if (!permKey) return false;
    return !userPermissions[permKey];
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {actions.map((action) => {
        const isDisabled = isActionDisabled(action.perm);
        return (
          <button
            key={action.key}
            disabled={isDisabled}
            onClick={() => !isDisabled && onActionClick && onActionClick(action.key)}
            className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm font-medium transition-all duration-150 ${
              isDisabled
                ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                : 'border-[#CBD5E1] text-[#475569] bg-white hover:bg-[#F1F5F9] hover:border-[#94A3B8] cursor-pointer'
            }`}
          >
            <Plus size={16} className={isDisabled ? 'text-slate-350' : 'text-[#64748B]'} />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

export default QuickActions;
