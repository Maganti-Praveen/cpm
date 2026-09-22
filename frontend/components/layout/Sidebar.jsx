// Lists navigation links for the admin panel, adapting to visual settings.
// Highlights active path selections.

import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../slices/authSlice';
import { useMemo } from 'react';
import logoImg from '../../assets/logo.webp';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserCheck,
  CheckSquare,
  Flag,
  FolderOpen,
  Receipt,
  MessageSquare,
  MessageCircle,
  BarChart2,
  Settings,
  LogOut,
  Mail,
  CreditCard,
  ArrowRightLeft,
  Activity,
  Shield,
  FileText,
  TrendingUp,
  ShieldAlert,
  Lock,
} from 'lucide-react';

import { useGlobalSettings } from '../../hooks/useGlobalSettings';

// All nav items with optional permissionKey for sub-admin filtering
// superAdminOnly: true  → only shown to the main ADMIN (no adminRole)
// permissionKey: 'xyz'  → shown to sub-admins only if permissions.xyz === true
// alwaysVisible: true   → shown to everyone (e.g. Dashboard)
const ALL_NAV_ITEMS = [
  { name: 'Dashboard',        icon: LayoutDashboard, path: '/admin/dashboard',        alwaysVisible: true },
  { name: 'Projects',         icon: Briefcase,        path: '/admin/projects',         permissionKey: 'projects' },
  { name: 'Clients',          icon: Users,            path: '/admin/clients',          permissionKey: 'clients' },
  { name: 'Staff',            icon: UserCheck,        path: '/admin/staff',            permissionKey: 'staff' },
  { name: 'Tasks',            icon: CheckSquare,      path: '/admin/tasks',            permissionKey: 'tasks' },
  { name: 'Milestones',       icon: Flag,             path: '/admin/milestones',       permissionKey: 'milestones' },
  { name: 'Documents',        icon: FolderOpen,       path: '/admin/documents',        permissionKey: 'documents' },
  { name: 'Invoices',         icon: Receipt,          path: '/admin/invoices',         permissionKey: 'invoices' },
  { name: 'Transactions',     icon: ArrowRightLeft,   path: '/admin/transactions',     permissionKey: 'transactions' },
  { name: 'Support',          icon: MessageSquare,    path: '/admin/support',          permissionKey: 'support' },
  { name: 'Messages',         icon: MessageCircle,    path: '/admin/messages',         alwaysVisible: true },
  { name: 'Contact Review',   icon: Mail,             path: '/admin/contact-reviews',  permissionKey: 'contact_reviews' },
  { name: 'Suspension Review', icon: ShieldAlert,      path: '/admin/suspension-reviews', permissionKey: 'suspension_reviews' },
  { name: 'Analytics',        icon: BarChart2,        path: '/admin/analytics',        permissionKey: 'analytics' },
  { name: 'Revenue Forecast', icon: TrendingUp,       path: '/admin/revenue-forecast', permissionKey: 'revenue_forecast' },
  { name: 'Audit Logs',       icon: Activity,         path: '/admin/audit-logs',       permissionKey: 'audit_logs' },
  { name: 'Login Activities', icon: Lock,             path: '/admin/login-activities', permissionKey: 'login_activities' },
  { name: 'Admin Management', icon: Shield,           path: '/admin/admin-management', superAdminOnly: true },
  { name: 'Email Config',     icon: Mail,             path: '/admin/email-config',     permissionKey: 'email_config' },
  { name: 'Settings',         icon: Settings,         path: '/admin/settings',         alwaysVisible: true },
  { name: 'Content Settings', icon: FileText,         path: '/admin/content-settings', permissionKey: 'content_settings' },
  { name: 'Payment Gateways', icon: CreditCard,       path: '/admin/payment-gateways', permissionKey: 'payment_gateways' },
];

function Sidebar({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // load site branding (logo, colors)
  const { siteTitle, siteLogo } = useGlobalSettings();

  // Determine if the logged-in user is a sub-admin (ADMIN role but isSuperAdmin !== true)
  const isSubAdmin = user?.role === 'ADMIN' && user?.isSuperAdmin !== true;
  const userPermissions = user?.permissions || {};

  // Filter nav items based on user's role/permissions
  const navItems = useMemo(() => {
    if (!isSubAdmin) {
      // Main super-admin: show all items
      return ALL_NAV_ITEMS;
    }
    // Sub-admin: only show Dashboard + items where their permission is granted
    return ALL_NAV_ITEMS.filter(item => {
      if (item.superAdminOnly) return false;
      if (item.alwaysVisible) return true;
      if (item.permissionKey) {
        let userPermissionsObj = {};
        if (typeof userPermissions === 'string') {
          try {
            userPermissionsObj = JSON.parse(userPermissions);
          } catch (_) {
            userPermissionsObj = {};
          }
        } else if (typeof userPermissions === 'object') {
          userPermissionsObj = userPermissions;
        }
        return userPermissionsObj[item.permissionKey] === true || userPermissionsObj[item.permissionKey] === 'true';
      }
      return false;
    });
  }, [isSubAdmin, userPermissions]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  const getActiveLinkClass = (isActive) => {
    const baseClass = "group flex items-center gap-3 h-12 px-4 rounded-lg no-underline";
    if (!isActive) {
      return `${baseClass} border-l-[3px] border-l-transparent hover:bg-[var(--bg-sidebar-hover)]`;
    }
    // Dynamic background and left border color based on root theme variables
    return `${baseClass} bg-[var(--bg-sidebar-active)] border-l-[3px] border-l-[var(--color-primary-mid)] text-[var(--text-sidebar-active)]`;
  };

  return (
    <aside className={`fixed top-0 left-0 h-screen w-60 bg-[var(--bg-sidebar)] flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:z-40`} aria-label="Admin sidebar navigation">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        <img
          src={siteLogo || logoImg}
          alt={siteTitle || "Sai IT Services logo"}
          className="w-10 h-10 object-contain rounded-lg p-0.5"
          style={{ backgroundColor: "#FFFFFF" }}
          width={40}
          height={40}
        />
        <div>
          <span className="block text-base font-semibold text-[var(--text-sidebar)] font-display leading-tight truncate max-w-[130px]" title={siteTitle}>
            {siteTitle}
          </span>
          <p className="text-[11px] text-[var(--text-sidebar)]/75 font-normal">
            {isSubAdmin ? user.adminRole : 'Admin Panel'}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto mt-2 no-scrollbar" aria-label="Main menu">
        {navItems.map((item) => (
          <NavLink
             key={item.name}
             to={item.path}
             onClick={onClose}
             className={({ isActive }) => getActiveLinkClass(isActive)}
          >
            {({ isActive }) => (
              <>
                <item.icon
                   size={20}
                   className={`shrink-0 transition-colors duration-150 ${
                     isActive ? 'text-[var(--text-sidebar-active)]' : 'text-[var(--text-sidebar)]/75 group-hover:text-[var(--text-sidebar)]/95'
                   }`}
                />
                <span
                   className={`text-sm font-medium transition-colors duration-150 ${
                     isActive ? 'text-[var(--text-sidebar-active)]' : 'text-[var(--text-sidebar)]/85 group-hover:text-[var(--text-sidebar)]/95'
                   }`}
                >
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5">
        <button
          onClick={handleLogout}
          className="group flex items-center gap-3 h-12 px-4 w-full rounded-lg border-l-[3px] border-l-transparent hover:bg-[var(--bg-sidebar-hover)] transition-all duration-150 cursor-pointer bg-transparent"
        >
          <LogOut
            size={20}
            className="shrink-0 text-[var(--text-sidebar)]/75 group-hover:text-[var(--text-sidebar)]/95 transition-colors duration-150"
          />
          <span className="text-sm font-medium text-[var(--text-sidebar)]/85 group-hover:text-[var(--text-sidebar)]/95 transition-colors duration-150">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
