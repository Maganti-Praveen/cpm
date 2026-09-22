// Administrative control center for inviting administrators and configuring profiles.
// lists active system admins.


import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { 
  Shield, 
  ShieldAlert,
  Plus, 
  Search, 
  X, 
  Mail, 
  Lock, 
  User, 
  Check, 
  Briefcase, 
  Receipt, 
  Users, 
  UserCheck, 
  CheckSquare, 
  FolderOpen, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit2, 
  MoreHorizontal, 
  SlidersHorizontal,
  Download,
  AlertCircle,
  Loader2,
  MessageSquare,
  BarChart2,
  FileText,
  CreditCard,
  Globe,
  Palette,
  Cloud,
  Flag,
  ArrowRightLeft,
  TrendingUp,
  Database
} from 'lucide-react';
import { exportToExcel } from '../../utils/excelExport';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/common/Pagination';
import API from '../../services/api';

const INITIAL_SUB_ADMINS = [];

/**
 * AdminManagement Component
 *
 * Administrative control center for inviting administrators, modifying sub-admin
 * permissions, exporting admin accounts list, and configuring security profiles.
 *
 * Key behaviors:
 * - Syncs local sub-admins using localStorage caching (`sai_sub_admins`).
 * - Resolves authentication tokens via Redux or window local storage.
 * - Handles search filters, pagination, and Excel data exportation.
 * - Provides full CRUD actions for sub-admins with specific togglable system permission properties.
 *
 * @component
 */
export default function AdminManagement() {
  const { showToast } = useToast();
  const { user: currentUser, token: reduxToken } = useSelector((state) => state.auth);
  // Always resolve the auth token — fallback to localStorage in case Redux hasn't rehydrated yet
  const token = reduxToken || localStorage.getItem('token');
  const API_BASE = import.meta.env.VITE_API_URL || '';

  const [admins, setAdmins] = useState(() => {
    const saved = localStorage.getItem('sai_sub_admins');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out dummy data if present
        const filtered = parsed.filter(admin => !['sub-admin-1', 'sub-admin-2', 'sub-admin-3'].includes(admin.id));
        return filtered;
      } catch (err) {
        console.error("Failed to parse sub-admins from localStorage:", err);
      }
    }
    // Set initial data if none exists
    localStorage.setItem('sai_sub_admins', JSON.stringify(INITIAL_SUB_ADMINS));
    return INITIAL_SUB_ADMINS;
  });

  // Current logged in admin details mapping
  const currentAdminItem = useMemo(() => {
    if (!currentUser) return null;
    return {
      id: `current-admin-${currentUser.id}`,
      name: currentUser.fullName,
      email: currentUser.email,
      role: currentUser.role === 'ADMIN' ? 'Super Admin' : currentUser.role,
      createdAt: currentUser.createdAt,
      lastLogin: currentUser.lastLogin || null,
      status: currentUser.status || 'Active',
      avatarColor: '#1E1B4B', // Premium dark contrast color representing current admin
      permissions: {
        invoices: true,
        projects: true,
        clients: true,
        staff: true,
        tasks: true,
        documents: true,
        support: true,
        contact_reviews: true,
        analytics: true,
        email_config: true,
        content_settings: true,
        payment_gateways: true,
        settings_site: true,
        settings_theme: true,
        settings_cloud: true,
        login_activities: true,
        audit_logs: true,
        milestones: true,
        transactions: true,
        suspension_reviews: true,
        revenue_forecast: true,
        settings_redis: true,
      },
      isCurrent: true // flag to prevent actions
    };
  }, [currentUser]);

  // Combine with stored admins
  const allAdmins = useMemo(() => {
    const list = [...admins];
    if (currentAdminItem) {
      // Don't add if an admin with the same email already exists to avoid duplication
      const exists = list.some(a => a.email.toLowerCase() === currentAdminItem.email.toLowerCase());
      if (!exists) {
        list.unshift(currentAdminItem);
      }
    }
    return list;
  }, [admins, currentAdminItem]);

  // Loading / error state for API calls
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState('all'); // 'all', 'profile', 'access'
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  // Dropdown list management
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: '',
    confirmColor: ''
  });
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionError, setSuspensionError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Finance Manager',
    status: 'Active',
    permissions: {
      invoices: false,
      projects: false,
      clients: false,
      staff: false,
      tasks: false,
      documents: false,
      support: false,
      contact_reviews: false,
      analytics: false,
      email_config: false,
      content_settings: false,
      payment_gateways: false,
      settings_site: false,
      settings_theme: false,
      settings_cloud: false,
      login_activities: false,
      audit_logs: false,
      milestones: false,
      transactions: false,
      suspension_reviews: false,
      revenue_forecast: false,
      settings_redis: false,
    }
  });

  // Handle outside click to close actions dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch admin accounts from the backend database and sync with local storage settings on mount
  useEffect(() => {
    if (!token) return;
    
    API.get('/users?role=ADMIN')
      .then(res => res.data)
      .then(json => {
        if (json.success && json.data) {
          const avatarColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
          
          const fetchedAdmins = json.data
            .filter(u => u.email.toLowerCase() !== currentUser?.email?.toLowerCase())
            .map(u => ({
              id: `sub-admin-${u.id}`,
              backendId: u.id,
              name: u.fullName,
              email: u.email,
              role: u.adminRole || 'Finance Manager',
              status: u.status || 'Active',
              createdAt: u.createdAt || new Date().toISOString(),
              lastLogin: u.lastLogin || null,
              avatarColor: avatarColors[u.id % avatarColors.length],
              permissions: {
                invoices: !!u.permissions?.invoices,
                projects: !!u.permissions?.projects,
                clients: !!u.permissions?.clients,
                staff: !!u.permissions?.staff,
                tasks: !!u.permissions?.tasks,
                documents: !!u.permissions?.documents,
                support: !!u.permissions?.support,
                contact_reviews: !!u.permissions?.contact_reviews,
                analytics: !!u.permissions?.analytics,
                email_config: !!u.permissions?.email_config,
                content_settings: !!u.permissions?.content_settings,
                payment_gateways: !!u.permissions?.payment_gateways,
                settings_site: !!u.permissions?.settings_site,
                settings_theme: !!u.permissions?.settings_theme,
                settings_cloud: !!u.permissions?.settings_cloud,
                login_activities: !!u.permissions?.login_activities,
                audit_logs: !!u.permissions?.audit_logs,
                milestones: !!u.permissions?.milestones,
                transactions: !!u.permissions?.transactions,
                suspension_reviews: !!u.permissions?.suspension_reviews,
                revenue_forecast: !!u.permissions?.revenue_forecast,
                settings_redis: !!u.permissions?.settings_redis,
              }
            }));
          
          setAdmins(fetchedAdmins);
          localStorage.setItem('sai_sub_admins', JSON.stringify(fetchedAdmins));
        }
      })
      .catch(err => console.error("Failed to load sub-admins from server:", err));
  }, [token, currentUser]);

  // Persist admin data to state + localStorage cache
  const saveAdminsToStorage = (updatedList) => {
    setAdmins(updatedList);
    localStorage.setItem('sai_sub_admins', JSON.stringify(updatedList));
  };

  // Pre-fill form for editing
  const openEditDrawer = (admin, mode = 'all') => {
    setEditMode(mode);
    setEditingAdminId(admin.id);
    setFormError('');
    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      password: '', // Keep blank if not editing password
      role: admin.role || 'Finance Manager',
      status: admin.status || 'Active',
      permissions: {
        invoices: !!admin.permissions?.invoices,
        projects: !!admin.permissions?.projects,
        clients: !!admin.permissions?.clients,
        staff: !!admin.permissions?.staff,
        tasks: !!admin.permissions?.tasks,
        documents: !!admin.permissions?.documents,
        support: !!admin.permissions?.support,
        contact_reviews: !!admin.permissions?.contact_reviews,
        analytics: !!admin.permissions?.analytics,
        email_config: !!admin.permissions?.email_config,
        content_settings: !!admin.permissions?.content_settings,
        payment_gateways: !!admin.permissions?.payment_gateways,
        settings_site: !!admin.permissions?.settings_site,
        settings_theme: !!admin.permissions?.settings_theme,
        settings_cloud: !!admin.permissions?.settings_cloud,
        login_activities: !!admin.permissions?.login_activities,
        audit_logs: !!admin.permissions?.audit_logs,
        milestones: !!admin.permissions?.milestones,
        transactions: !!admin.permissions?.transactions,
        suspension_reviews: !!admin.permissions?.suspension_reviews,
        revenue_forecast: !!admin.permissions?.revenue_forecast,
        settings_redis: !!admin.permissions?.settings_redis,
      }
    });
    setIsDrawerOpen(true);
    setActiveDropdownId(null);
  };

  // Open drawer for adding new admin
  const openAddDrawer = () => {
    setEditMode('all');
    setEditingAdminId(null);
    setFormError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Finance Manager',
      status: 'Active',
      permissions: {
        invoices: false,
        projects: false,
        clients: false,
        staff: false,
        tasks: false,
        documents: false,
        support: false,
        contact_reviews: false,
        analytics: false,
        email_config: false,
        content_settings: false,
        payment_gateways: false,
        settings_site: false,
        settings_theme: false,
        settings_cloud: false,
        login_activities: false,
        audit_logs: false,
        milestones: false,
        transactions: false,
        suspension_reviews: false,
        revenue_forecast: false,
        settings_redis: false,
      }
    });
    setShowPassword(false);
    setIsDrawerOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionToggle = (moduleKey) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...(prev.permissions || {}),
        [moduleKey]: !prev.permissions?.[moduleKey]
      }
    }));
  };

  // Submits administrator creation or modification forms data to service layer
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!editingAdminId && !formData.password) {
      setFormError('Please set a password for the new sub-admin.');
      return;
    }

    setIsSubmitting(true);
    const avatarColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

    if (!token) {
      setFormError('Authentication error: No session token found. Please refresh the page and try again.');
      setIsSubmitting(false);
      return;
    }

    console.log('[AdminManagement] Submitting form, token present:', !!token, 'API_BASE:', API_BASE || '(proxy)');

    try {
      if (editingAdminId) {
        // Find existing admin record to get the real backend DB id
        const existingAdmin = admins.find(a => a.id === editingAdminId);
        const backendId = existingAdmin?.backendId;

        // Update in UI state
        const updatedLocally = admins.map(admin => {
          if (admin.id === editingAdminId) {
            return {
              ...admin,
              name: formData.name,
              email: formData.email,
              role: formData.role,
              status: formData.status,
              permissions: formData.permissions,
            };
          }
          return admin;
        });

        // Call backend if we have a real DB id
        if (backendId) {
          const updatePayload = {
            fullName: formData.name,
            email: formData.email,
            role: 'ADMIN',
            status: formData.status,
            adminRole: formData.role,
            permissions: formData.permissions,
          };
          if (formData.password) {
            updatePayload.password = formData.password;
          }
          const axiosRes = await API.put(`/users/${backendId}`, updatePayload);
          if (!axiosRes.data || !axiosRes.data.success) {
            throw new Error(axiosRes.data?.message || 'Failed to update admin account');
          }
        }

        saveAdminsToStorage(updatedLocally);
        showToast(`Sub-Admin account "${formData.name}" updated successfully!`, 'success');
      } else {
        // Create new sub-admin in backend
        const axiosRes = await API.post('/auth/register', {
          fullName: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'ADMIN',
          status: formData.status,
          adminRole: formData.role,
          permissions: formData.permissions,
        });

        if (!axiosRes.data || !axiosRes.data.success) {
          throw new Error(axiosRes.data?.message || 'Failed to create admin account');
        }

        const { data: createdUser } = axiosRes.data;

        const newAdmin = {
          id: `sub-admin-${Date.now()}`,
          backendId: createdUser.id, // store real DB id for future edits/deletes
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          createdAt: new Date().toISOString(),
          avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
          permissions: formData.permissions
        };
        saveAdminsToStorage([...admins, newAdmin]);
        showToast('Sub-Admin account created successfully! They can now log in with their credentials.', 'success');
      }

      setIsDrawerOpen(false);
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        const errorList = responseData.errors.map(e => e.message).join(', ');
        setFormError(`Validation failed: ${errorList}`);
      } else {
        setFormError(responseData?.message || err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submits the custom confirmation modal action, checking suspension reason validation if required
  const handleConfirmAction = () => {
    if (confirmConfig.showTextArea) {
      if (!suspensionReason.trim()) {
        setSuspensionError('Please provide a reason.');
        return;
      }
      confirmConfig.onConfirmWithArg(suspensionReason.trim());
    } else {
      confirmConfig.onConfirm();
    }
  };

  // Triggers delete confirmation dialog modal (blocks if active, redirects to suspension first)
  const handleDeleteAdmin = (id, name) => {
    setActiveDropdownId(null);
    const admin = admins.find(a => a.id === id);
    if (!admin) return;

    if (admin.status !== 'Suspended') {
      setSuspensionReason('');
      setSuspensionError('');
      setConfirmConfig({
        isOpen: true,
        title: 'Suspension Required',
        message: `Account for sub-admin "${name}" must be suspended before deletion.`,
        confirmText: 'Suspend Account',
        confirmColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        showTextArea: true,
        onConfirmWithArg: (reason) => handleSuspendFromBlocker(admin, reason)
      });
    } else {
      setConfirmConfig({
        isOpen: true,
        title: 'Confirm Deletion',
        message: `Are you sure you want to permanently delete sub-admin "${name}"? This action cannot be undone.`,
        confirmText: 'Delete Account',
        confirmColor: 'bg-rose-600 hover:bg-rose-700 text-white',
        showTextArea: false,
        onConfirm: () => executeDeleteAdmin(id, name)
      });
    }
  };

  // Handles suspending the sub-admin from the deletion blocker modal
  const handleSuspendFromBlocker = async (admin, reason) => {
    try {
      if (admin.backendId) {
        await API.put(`/users/${admin.backendId}`, {
          fullName: admin.name,
          email: admin.email,
          role: 'ADMIN',
          status: 'Suspended',
          adminRole: admin.role,
          permissions: admin.permissions,
          suspensionReason: reason
        });
      }

      // Update local state
      const updatedAdmins = admins.map(a => {
        if (a.id === admin.id) {
          return { ...a, status: 'Suspended' };
        }
        return a;
      });
      setAdmins(updatedAdmins);
      saveAdminsToStorage(updatedAdmins);

      showToast(`Sub-admin account suspended successfully.`, "success");

      // Auto transition to deletion confirmation dialog
      setConfirmConfig({
        isOpen: true,
        title: 'Confirm Deletion',
        message: `Account suspended successfully! Are you sure you want to permanently delete sub-admin "${admin.name}"? This action cannot be undone.`,
        confirmText: 'Delete Account',
        confirmColor: 'bg-rose-600 hover:bg-rose-700 text-white',
        showTextArea: false,
        onConfirm: () => executeDeleteAdmin(admin.id, admin.name)
      });
    } catch (err) {
      console.error("Error suspending from blocker:", err);
      setSuspensionError(err.response?.data?.message || "Failed to suspend account.");
    }
  };

  // Executes actual deletion
  const executeDeleteAdmin = async (id, name) => {
    const adminToDelete = admins.find(a => a.id === id);
    const backendId = adminToDelete?.backendId;

    // Remove from local state immediately for responsive UX
    const updated = admins.filter(admin => admin.id !== id);
    saveAdminsToStorage(updated);
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));

    // Also delete from backend if we have the real DB id
    if (backendId) {
      try {
        await API.delete(`/users/${backendId}`);
        showToast(`Sub-admin "${name}" deleted successfully.`, 'success');
      } catch (err) {
        console.error('Failed to delete admin from backend:', err);
        showToast(err.response?.data?.message || 'Failed to delete sub-admin from server.', 'error');
      }
    }
  };

  // Triggers status toggle confirmation dialog modal
  const handleToggleStatus = (admin) => {
    const newStatus = admin.status === 'Active' ? 'Suspended' : 'Active';
    const actionText = newStatus === 'Suspended' ? 'Suspend' : 'Activate';

    setActiveDropdownId(null);

    if (newStatus === 'Suspended') {
      setSuspensionReason('');
      setSuspensionError('');
      setConfirmConfig({
        isOpen: true,
        title: 'Confirm Account Suspension',
        message: `Are you sure you want to suspend the account of "${admin.name}"? The user will be immediately blocked from logging in.`,
        confirmText: 'Suspend Account',
        confirmColor: 'bg-amber-600 hover:bg-amber-700 text-white',
        showTextArea: true,
        onConfirmWithArg: (reason) => executeToggleStatus(admin, 'Suspended', reason)
      });
    } else {
      setConfirmConfig({
        isOpen: true,
        title: 'Activate Sub-Admin',
        message: `Are you sure you want to change the status of "${admin.name}" to Active?`,
        confirmText: 'Activate Account',
        confirmColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        showTextArea: false,
        onConfirm: () => executeToggleStatus(admin, 'Active')
      });
    }
  };

  // Executes actual status toggle update
  const executeToggleStatus = async (admin, newStatus, reason = '') => {
    const originalAdmins = [...admins];

    try {
      // Update local state immediately for responsive UX
      const updatedAdmins = admins.map(a => {
        if (a.id === admin.id) {
          return { ...a, status: newStatus };
        }
        return a;
      });
      setAdmins(updatedAdmins);
      saveAdminsToStorage(updatedAdmins);
      setConfirmConfig(prev => ({ ...prev, isOpen: false }));

      // Call backend if we have a real backendId
      if (admin.backendId) {
        await API.put(`/users/${admin.backendId}`, {
          fullName: admin.name,
          email: admin.email,
          role: 'ADMIN',
          status: newStatus,
          adminRole: admin.role,
          permissions: admin.permissions,
          suspensionReason: reason
        });
      }
      showToast(`Sub-admin status updated to ${newStatus} successfully!`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to update status', 'error');
      // Rollback state if backend fails
      setAdmins(originalAdmins);
      saveAdminsToStorage(originalAdmins);
    }
  };

  // Converts active administrators logs to spreadsheet rows format and exports
  const handleExport = () => {
    try {
      if (filteredAdmins.length === 0) {
        showToast("No sub-admin records to export.", "error");
        return;
      }
      const mapped = filteredAdmins.map(admin => ({
        "Name": admin.name,
        "Email": admin.email,
        "Role": admin.role,
        "Status": admin.status,
        "Date Created": new Date(admin.createdAt).toLocaleDateString(),
        "Permissions": Object.keys(admin.permissions)
          .filter(k => admin.permissions[k])
          .join(', ') || 'None'
      }));
      exportToExcel(mapped, "SubAdmins");
    } catch (err) {
      console.error("Failed to export sub-admins:", err);
      showToast("Failed to export sub-admins data.", "error");
    }
  };

  // Filters logic
  const filteredAdmins = useMemo(() => {
    return allAdmins.filter(admin => {
      const matchesSearch = 
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'All' || admin.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || admin.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [allAdmins, searchQuery, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE));

  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAdmins.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAdmins, currentPage]);

  // Unique roles for dropdown filters
  const rolesList = useMemo(() => {
    const list = new Set(allAdmins.map(a => a.role));
    return ['All', ...Array.from(list)];
  }, [allAdmins]);

  const getInitials = (name) => {
    return name
      ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'AD';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            Admin Management
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Create sub-admins and configure their section-wise platform permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          {/* Export to Excel */}
          <button
            onClick={handleExport}
            disabled={filteredAdmins.length === 0}
            title={filteredAdmins.length === 0 ? "No data to export" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label={filteredAdmins.length === 0 ? "No data to export" : "Export to Excel"}>
            <Download size={15} />
            Export Data
          </button>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border text-sm font-medium transition-all duration-150 cursor-pointer ${
              showFilters
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'border-[#CBD5E1] text-[#475569] bg-white hover:bg-[#F1F5F9] hover:border-[#94A3B8]'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filter
          </button>

          {/* Add Admin Button */}
          <button
            onClick={openAddDrawer}
            className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-[#4F46E5] text-sm font-medium text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer shadow-sm flex-1 sm:flex-none"
          >
            <Plus size={16} />
            Add New Admin
          </button>
        </div>
      </div>

      {/* Filters Box */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm transition-all duration-200">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[2.375rem] pl-9 pr-4 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all"
             aria-label="Search by name, email, or role..."/>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-[2.375rem] px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all cursor-pointer"
               aria-label="Select h-[2.375rem] px-3 rounded-lg border border-[# c b d5 e1] bg-white text-sm text-[#0 f172 a] outline-none focus:border-[#4 f46 e5] focus:ring-[3px] focus:ring-[#4 f46 e5]/12 transition-all cursor-pointer">
                {rolesList.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-[2.375rem] px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all cursor-pointer"
               aria-label="Select h-[2.375rem] px-3 rounded-lg border border-[# c b d5 e1] bg-white text-sm text-[#0 f172 a] outline-none focus:border-[#4 f46 e5] focus:ring-[3px] focus:ring-[#4 f46 e5]/12 transition-all cursor-pointer">
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div 
          className="overflow-x-auto"
          style={{ paddingBottom: activeDropdownId ? '120px' : '0px' }}
        >
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th scope="col" className="text-left py-3.5 px-5 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                  Sub-Admin Account
                </th>
                <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                  Title / Role
                </th>
                <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                  Section Permissions
                </th>
                <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                  Status
                </th>
                <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                  Last Login
                </th>
                <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                  Date Added
                </th>
                <th scope="col" className="text-center py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em] w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedAdmins.map((admin) => (
                <tr
                  key={admin.id}
                  className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC]/50 transition-colors"
                >
                  {/* Account Name & Initials */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: admin.avatarColor || '#4F46E5' }}
                      >
                        {getInitials(admin.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A] font-display">
                          {admin.name}
                        </p>
                        <span className="text-xs font-semibold text-slate-500 font-sans block mt-0.5">
                          {admin.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Title / Role */}
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                      <Shield size={12} className="text-slate-500 shrink-0" />
                      {admin.role}
                    </span>
                  </td>

                  {/* Permissions capsules */}
                  <td className="py-4 px-4 max-w-sm">
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries({
                        projects: { label: 'Projects', icon: Briefcase },
                        invoices: { label: 'Invoices', icon: Receipt },
                        clients: { label: 'Clients', icon: Users },
                        staff: { label: 'Staff', icon: UserCheck },
                        tasks: { label: 'Tasks', icon: CheckSquare },
                        milestones: { label: 'Milestones', icon: Flag },
                        documents: { label: 'Docs', icon: FolderOpen },
                        transactions: { label: 'Transactions', icon: ArrowRightLeft },
                        support: { label: 'Support', icon: MessageSquare },
                        contact_reviews: { label: 'Contact Rev', icon: Mail },
                        suspension_reviews: { label: 'Suspension Rev', icon: ShieldAlert },
                        analytics: { label: 'Analytics', icon: BarChart2 },
                        revenue_forecast: { label: 'Revenue Forecast', icon: TrendingUp },
                        email_config: { label: 'Email Config', icon: Mail },
                        content_settings: { label: 'Content Settings', icon: FileText },
                        payment_gateways: { label: 'Gateways', icon: CreditCard },
                        settings_site: { label: 'Settings: Site', icon: Globe },
                        settings_theme: { label: 'Settings: Theme', icon: Palette },
                        settings_cloud: { label: 'Settings: Cloud', icon: Cloud },
                        settings_redis: { label: 'Settings: Redis', icon: Database },
                        login_activities: { label: 'Login Activities', icon: ShieldAlert },
                        audit_logs: { label: 'Audit Logs', icon: FileText },
                      })
                        .filter(([key]) => !!admin.permissions?.[key])
                        .map(([key, data]) => {
                          const Icon = data.icon;
                          return (
                            <span 
                              key={key}
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-250 bg-indigo-50 text-indigo-700 whitespace-nowrap"
                            >
                              <Icon size={10} />
                              {data.label}
                            </span>
                          );
                        })}
                      {Object.values(admin.permissions || {}).filter(Boolean).length === 0 && (
                        <span className="text-xs font-semibold text-slate-450">None</span>
                      )}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      admin.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : admin.status === 'Suspended'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        admin.status === 'Active' 
                          ? 'bg-emerald-500' 
                          : admin.status === 'Suspended'
                            ? 'bg-rose-500'
                            : 'bg-slate-400'
                      }`} />
                      {admin.status}
                    </span>
                  </td>

                  {/* Last Login */}
                  <td className="py-4 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                    {admin.lastLogin 
                      ? new Date(admin.lastLogin).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Never'
                    }
                  </td>

                  {/* Date Created */}
                  <td className="py-4 px-4 text-xs font-medium text-slate-500">
                    {admin.createdAt 
                      ? new Date(admin.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : '—'
                    }
                  </td>

                  {/* Actions Dots Menu */}
                  <td className="py-4 px-4 text-center relative">
                    {admin.isCurrent ? (
                      <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 uppercase tracking-wide">
                        <Lock size={10} className="text-slate-400" />
                        No Actions
                      </span>
                    ) : (
                      <>
                        <button 
                          onClick={() => setActiveDropdownId(activeDropdownId === admin.id ? null : admin.id)}
                          className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#475569] cursor-pointer transition-colors"
                          aria-label="Actions dropdown"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdownId === admin.id && (
                          <div 
                            ref={dropdownRef}
                            className="absolute right-4 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 text-left animate-fade-in"
                          >
                            <button
                              onClick={() => openEditDrawer(admin, 'profile')}
                              className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <User size={13} className="text-slate-400" />
                              Edit Profile
                            </button>
                            <button
                              onClick={() => openEditDrawer(admin, 'access')}
                              className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50"
                            >
                              <Edit2 size={13} className="text-slate-400" />
                              Edit Access
                            </button>
                            <button
                              onClick={() => handleToggleStatus(admin)}
                              className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50"
                            >
                              <ShieldAlert size={13} className={admin.status === 'Active' ? 'text-amber-500' : 'text-emerald-500'} />
                              {admin.status === 'Active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                              className="w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50"
                            >
                              <Trash2 size={13} className="text-rose-400" />
                              Delete Admin
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {paginatedAdmins.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-sm text-[#64748B] font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p>No sub-admins match your filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]/30">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAdmins.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      {/* Centered Modal Popup Form */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
          />

          {/* Modal content */}
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-10 animate-scale-up max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-[#F8FAFC] shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  {editingAdminId 
                    ? editMode === 'profile' 
                      ? 'Edit Sub-Admin Profile' 
                      : editMode === 'access'
                        ? 'Edit Sub-Admin Access'
                        : 'Edit Sub-Admin Details'
                    : 'Add New Sub-Admin'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingAdminId 
                    ? editMode === 'profile' 
                      ? 'Configure sub-admin account details, role and status.' 
                      : editMode === 'access'
                        ? 'Configure sub-admin page and settings tab access rights.'
                        : 'Configure account settings and module access.'
                    : 'Register a new admin with specific page accesses.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-650 hover:bg-slate-150 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[calc(90vh-140px)]">
                {(editMode === 'profile' || editMode === 'all') && (
                  <>
                    {/* 2-column grid for name and email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Admin Full Name
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. Liam Sterling"
                        className="w-full h-9 pl-9 pr-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/12 transition-all placeholder:text-slate-400"
                       aria-label="e.g. Liam Sterling"/>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. admin@saiitservices.com"
                        className="w-full h-9 pl-9 pr-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/12 transition-all placeholder:text-slate-400"
                       aria-label="e.g. admin@saiitservices.com"/>
                    </div>
                  </div>
                </div>

                {/* 3-column grid for password, role, and status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      {editingAdminId ? 'Update Password' : 'Password'}
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!editingAdminId}
                        placeholder={editingAdminId ? "Keep blank to retain" : "Password"}
                        className="w-full h-9 pl-9 pr-10 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/12 transition-all placeholder:text-slate-400"
                       aria-label="Password"/>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Title / Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/12 transition-all bg-white cursor-pointer"
                     aria-label="Select role">
                      <option value="Finance Manager">Finance Manager</option>
                      <option value="Project Moderator">Project Moderator</option>
                      <option value="Support Coordinator">Support Coordinator</option>
                      <option value="Systems Manager">Systems Manager</option>
                      <option value="Client Relationship Manager">Client Relationship Manager</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/12 transition-all bg-white cursor-pointer"
                     aria-label="Select status">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                  </>
                )}

                {/* Permissions Section */}
                {(editMode === 'access' || editMode === 'all') && (
                  <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 font-display mb-3 uppercase tracking-wider">
                    Access Permissions
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Sidebar Pages Group */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Sidebar Page Access</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                        {Object.entries({
                          projects: { label: 'Projects Module', desc: 'Projects directory access', icon: Briefcase },
                          invoices: { label: 'Invoices & Billing', desc: 'Invoices & billing history', icon: Receipt },
                          clients: { label: 'Client Relations', desc: 'Client profile directory', icon: Users },
                          staff: { label: 'Staff Directory', desc: 'Staff lists & roles', icon: UserCheck },
                          tasks: { label: 'Task Tracking', desc: 'Task checkboard access', icon: CheckSquare },
                          milestones: { label: 'Milestones Module', desc: 'Project phase roadmap', icon: Flag },
                          documents: { label: 'Documents Vault', desc: 'Upload workspace files', icon: FolderOpen },
                          transactions: { label: 'Transactions History', desc: 'Payment transaction logs', icon: ArrowRightLeft },
                          support: { label: 'Support Desk', desc: 'Support tickets inbox', icon: MessageSquare },
                          contact_reviews: { label: 'Contact Submissions', desc: 'Public messages list', icon: Mail },
                          suspension_reviews: { label: 'Suspension Reviews', desc: 'Suspended user appeals', icon: ShieldAlert },
                          analytics: { label: 'Business Analytics', desc: 'Financial charts & stats', icon: BarChart2 },
                          revenue_forecast: { label: 'Revenue Forecast', desc: 'Predict future earnings', icon: TrendingUp },
                          email_config: { label: 'SMTP Email Config', desc: 'SMTP / System emails', icon: Mail },
                          content_settings: { label: 'Content Settings', desc: 'Public page CMS content', icon: FileText },
                          payment_gateways: { label: 'Payment Gateways', desc: 'Configure payment integrations', icon: CreditCard },
                          login_activities: { label: 'Login Activities', desc: 'Login attempts & lockouts', icon: ShieldAlert },
                          audit_logs: { label: 'Security Audit Logs', desc: 'Admin audit logs history', icon: FileText },
                        }).map(([key, item]) => {
                          const Icon = item.icon;
                          const isChecked = !!formData.permissions?.[key];
                          return (
                            <label 
                              key={key}
                              className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-150 cursor-pointer ${
                                isChecked 
                                  ? 'bg-white border-indigo-250 shadow-xs' 
                                  : 'bg-white/60 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handlePermissionToggle(key)}
                                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer transition-colors"
                               aria-label="Mt-0.5 w-4 h-4 rounded border-slate-300 text-[#4 F46 E5] focus:ring-[#4 F46 E5]/30 cursor-pointer transition-colors"/>
                              <div className="flex items-start gap-2">
                                <Icon size={14} className={`mt-0.5 shrink-0 ${isChecked ? 'text-[#4F46E5]' : 'text-slate-400'}`} />
                                <div>
                                  <p className={`text-xs font-semibold ${isChecked ? 'text-slate-900' : 'text-slate-700'}`}>{item.label}</p>
                                  <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{item.desc}</p>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Settings Sub-pages Group */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Settings Tab Access</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                        {Object.entries({
                          settings_site: { label: 'Site Settings', desc: 'General info & metadata', icon: Globe },
                          settings_theme: { label: 'Theme Settings', desc: 'System colors & branding', icon: Palette },
                          settings_cloud: { label: 'Cloud Storage', desc: 'Cloudinary configuration', icon: Cloud },
                          settings_redis: { label: 'Redis Cache', desc: 'Runtime cache configuration', icon: Database },
                        }).map(([key, item]) => {
                          const Icon = item.icon;
                          const isChecked = !!formData.permissions?.[key];
                          return (
                            <label 
                              key={key}
                              className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-150 cursor-pointer ${
                                isChecked 
                                  ? 'bg-white border-indigo-250 shadow-xs' 
                                  : 'bg-white/60 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handlePermissionToggle(key)}
                                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer transition-colors"
                               aria-label="Mt-0.5 w-4 h-4 rounded border-slate-300 text-[#4 F46 E5] focus:ring-[#4 F46 E5]/30 cursor-pointer transition-colors"/>
                              <div className="flex items-start gap-2">
                                <Icon size={14} className={`mt-0.5 shrink-0 ${isChecked ? 'text-[#4F46E5]' : 'text-slate-400'}`} />
                                <div>
                                  <p className={`text-xs font-semibold ${isChecked ? 'text-slate-900' : 'text-slate-700'}`}>{item.label}</p>
                                  <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{item.desc}</p>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>

              {/* Form Error */}
              {formError && (
                <div className="mx-6 mb-0 -mt-2 flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
                  <AlertCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-semibold text-rose-700">{formError}</p>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="p-6 border-t border-slate-100 bg-[#F8FAFC] flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 h-9 rounded-lg border border-slate-300 text-slate-650 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-[#4F46E5] hover:bg-[#3730A3] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <><Loader2 size={13} className="animate-spin" /> {editingAdminId ? 'Saving...' : 'Creating...'}</>
                  ) : (
                    editingAdminId ? 'Save Changes' : 'Save Admin'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4 animate-scale-up text-left">
            <div className="flex items-center gap-2.5">
              <span className={`p-2 rounded-full shrink-0 ${
                confirmConfig.confirmColor.includes('rose') 
                  ? 'bg-rose-50 text-rose-600' 
                  : confirmConfig.confirmColor.includes('emerald') 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-amber-50 text-amber-600'
              }`}>
                <Shield size={20} />
              </span>
              <h3 className="text-base font-bold text-slate-900 font-display">{confirmConfig.title}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              {confirmConfig.message}
            </p>

            {confirmConfig.showTextArea && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Provide Suspension Reason
                  </label>
                  <textarea
                    value={suspensionReason}
                    onChange={(e) => {
                      setSuspensionReason(e.target.value);
                      if (e.target.value.trim()) setSuspensionError('');
                    }}
                    placeholder="e.g. Inactive account, violation of policies, etc."
                    className={suspensionError ? "w-full min-h-[80px] p-2.5 text-xs border border-rose-500 focus:ring-rose-500/12 rounded-lg outline-none focus:border-rose-500 focus:ring-2 transition-all placeholder:text-slate-400 resize-none font-sans" : "w-full min-h-[80px] p-2.5 text-xs border border-slate-300 focus:ring-rose-500/12 rounded-lg outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/12 transition-all placeholder:text-slate-400 resize-none font-sans"}
                    required
                  />
                  {suspensionError && (
                    <p className="text-[10px] text-rose-600 font-semibold mt-1.5 animate-fade-in">
                      {suspensionError}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                className="px-4 h-9 rounded-lg border border-slate-300 text-slate-650 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-4 h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${confirmConfig.confirmColor}`}
              >
                {confirmConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
