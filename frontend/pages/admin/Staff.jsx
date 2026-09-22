import { useToast } from '../../context/ToastContext';
// Directory list compiling profiles for system staff and configuring permissions.
// Handles staff roles.

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Plus, Filter, MoreHorizontal, SlidersHorizontal, Search, Edit2, Trash2, Download, Upload, Ban, UserCheck } from 'lucide-react';
import { exportToExcel } from '../../utils/excelExport';
import StatusBadge from '../../components/common/StatusBadge';
import NewStaffModal from '../../components/staff/NewStaffModal';
import ImportStaffModal from '../../components/staff/ImportStaffModal';
import { getUsers, registerUser, updateUser, deleteUser, bulkDeleteUsers } from '../../services/authService';
import Pagination from '../../components/common/Pagination';

/**
 * AdminStaff Component
 *
 * Directory list compiling profiles for system staff members and configuring permissions/access roles.
 * Supports:
 * - Real-time filtering by status and name/email search.
 * - Profile updates, deletions, and user suspension triggers.
 * - Batch Excel exporting and CSV template downloading/bulk imports.
 * - Role mapping and sub-admin feature-level authorization control.
 *
 * @component
 */
function AdminStaff() {
  const { showToast } = useToast();
  const [staff, setStaff] = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [deleteConfirmConfig, setDeleteConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });
  
  const [suspensionConfirmUser, setSuspensionConfirmUser] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionError, setSuspensionError] = useState('');
  
  const dropdownRef = useRef(null);

  // Handle Export to Excel
  const handleExport = () => {
    try {
      if (filteredStaff.length === 0) {
        showToast("No data available to export!", "error");
        return;
      }
      const mapped = filteredStaff.map(member => ({
        "Staff Member": member.name || '',
        "Email": member.email || '',
        "Phone": member.phone || '',
        "Status": member.status || ''
      }));
      exportToExcel(mapped, "Staff");
    } catch (err) {
      console.error("Failed to export staff:", err);
      showToast("Failed to export staff data.", "error");
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch staff members (User role = STAFF) from Neon DB
  const fetchStaff = useCallback(() => {
    setLoading(true);
    getUsers({ role: 'STAFF' })
      .then((res) => {
        const allUsers = res.data.data || [];
        // Format properties for display
        const colors = ['#6366F1', '#7C3AED', '#DB2777', '#0284C7', '#059669', '#D97706'];
        const formatted = allUsers.map((s, index) => {
          const initials = s.fullName
            ? s.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            : 'ST';
          return {
            id: s.id,
            name: s.fullName,
            email: s.email,
            phone: s.phone || 'N/A',
            status: s.status || 'Active',
            role: s.role,
            initials,
            avatarColor: colors[index % colors.length],
            avatar: s.avatar || null
          };
        });
        setStaff(formatted);
        setSelectedStaffIds([]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading staff members:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Filter staff
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const matchesSearch =
        (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        statusFilter === 'All' || s.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [staff, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / ITEMS_PER_PAGE));

  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStaff.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStaff, currentPage]);

  const handleSaveStaff = (newStaffData) => {
    if (selectedStaff) {
      // Edit mode
      return updateUser(selectedStaff.id, newStaffData)
        .then(() => {
          setSelectedStaff(null);
          fetchStaff();
          showToast("Staff member updated successfully.", "success");
        })
        .catch((err) => {
          console.error("Error updating staff member:", err);
          showToast(err.response?.data?.message || "Failed to update staff member.", "error");
          throw err;
        });
    } else {
      // Create mode
      return registerUser(newStaffData)
        .then(() => {
          fetchStaff();
          showToast("Staff member created successfully.", "success");
        })
        .catch((err) => {
          console.error("Error creating staff member:", err);
          showToast(err.response?.data?.message || "Failed to create staff member.", "error");
          throw err;
        });
    }
  };

  // Handle deleting staff member
  const handleDeleteClick = (id, name) => {
    setActiveDropdownId(null);
    const target = staff.find(s => s.id === id);
    if (target && target.status !== 'Suspended') {
      setDeleteConfirmConfig({
        isOpen: true,
        title: 'Suspension Required',
        message: `Account for staff member ${name} must be suspended before deletion.`,
        userId: id,
        userName: name,
        status: 'Blocker',
        suspensionReason: '',
        error: '',
        onConfirm: null
      });
    } else {
      setDeleteConfirmConfig({
        isOpen: true,
        title: 'Confirm Deletion',
        message: `Are you sure you want to permanently delete staff member ${name}? This action cannot be undone.`,
        userId: id,
        userName: name,
        status: 'Normal',
        onConfirm: () => {
          deleteUser(id)
            .then(() => {
              fetchStaff();
              showToast("Staff member deleted successfully.", "success");
              setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
            })
            .catch((err) => {
              console.error("Error deleting staff member:", err);
              showToast(err.response?.data?.message || "Failed to delete staff member.", "error");
              setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
            });
        }
      });
    }
  };

  const handleSuspendFromBlocker = (id, reason) => {
    if (!reason.trim()) {
      setDeleteConfirmConfig(prev => ({ ...prev, error: 'Please provide a suspension reason.' }));
      return;
    }
    
    updateUser(id, {
      status: 'Suspended',
      suspensionReason: reason
    })
      .then(() => {
        fetchStaff();
        showToast("Staff account suspended successfully.", "success");
        setDeleteConfirmConfig(prev => ({
          ...prev,
          title: 'Confirm Deletion',
          message: `Account suspended successfully! Are you sure you want to permanently delete staff member ${prev.userName}? This action cannot be undone.`,
          status: 'Normal',
          onConfirm: () => {
            deleteUser(id)
              .then(() => {
                fetchStaff();
                showToast("Staff member deleted successfully.", "success");
                setDeleteConfirmConfig(p => ({ ...p, isOpen: false }));
              })
              .catch((err) => {
                console.error("Error deleting staff member:", err);
                showToast(err.response?.data?.message || "Failed to delete staff member.", "error");
                setDeleteConfirmConfig(p => ({ ...p, isOpen: false }));
              });
          }
        }));
      })
      .catch((err) => {
        console.error("Error suspending staff member:", err);
        setDeleteConfirmConfig(prev => ({
          ...prev,
          error: err.response?.data?.message || "Failed to suspend account."
        }));
      });
  };

  const handleReactivateUser = (user) => {
    setActiveDropdownId(null);
    updateUser(user.id, { status: 'Active' })
      .then(() => {
        fetchStaff();
        showToast("Staff account reactivated successfully.", "success");
      })
      .catch((err) => {
        console.error("Error reactivating staff member:", err);
        showToast(err.response?.data?.message || "Failed to reactivate account.", "error");
      });
  };

  const handleConfirmSuspension = () => {
    if (!suspensionReason.trim()) {
      setSuspensionError("Please provide a suspension reason.");
      return;
    }
    setSuspensionError('');
    updateUser(suspensionConfirmUser.id, {
      status: 'Suspended',
      suspensionReason: suspensionReason
    })
      .then(() => {
        setSuspensionConfirmUser(null);
        setSuspensionReason('');
        fetchStaff();
        showToast("Staff account suspended successfully.", "success");
      })
      .catch((err) => {
        console.error("Error suspending staff member:", err);
        showToast(err.response?.data?.message || "Failed to suspend account.", "error");
      });
  };

  const handleBulkSuspendFromBlocker = async (activeStaff, reason) => {
    if (!reason || !reason.trim()) {
      setDeleteConfirmConfig(prev => ({ ...prev, error: 'Please provide a suspension reason.' }));
      return;
    }

    try {
      await Promise.all(
        activeStaff.map(member => 
          updateUser(member.id, {
            status: 'Suspended',
            suspensionReason: reason
          })
        )
      );

      fetchStaff();
      showToast("Active staff members suspended successfully.", "success");

      setDeleteConfirmConfig(prev => ({
        ...prev,
        title: 'Confirm Bulk Deletion',
        message: `All selected active staff members have been suspended! Are you sure you want to permanently delete the ${selectedStaffIds.length} selected staff members?`,
        status: 'Normal',
        onConfirm: () => {
          bulkDeleteUsers(selectedStaffIds)
            .then(() => {
              setSelectedStaffIds([]);
              fetchStaff();
              showToast("Selected staff members deleted successfully.", "success");
              setDeleteConfirmConfig(p => ({ ...p, isOpen: false }));
            })
            .catch((err) => {
              console.error("Error bulk deleting staff members:", err);
              showToast(err.response?.data?.message || "Failed to delete staff members.", "error");
              setDeleteConfirmConfig(p => ({ ...p, isOpen: false }));
            });
        }
      }));
    } catch (err) {
      console.error("Error bulk suspending staff members:", err);
      showToast(err.response?.data?.message || "Failed to suspend active staff members.", "error");
    }
  };

  const handleBulkDelete = () => {
    const activeStaff = staff.filter(member => selectedStaffIds.includes(member.id) && member.status !== 'Suspended');
    
    if (activeStaff.length > 0) {
      const namesList = activeStaff.map(member => member.name || member.fullName).join(', ');
      setDeleteConfirmConfig({
        isOpen: true,
        title: 'Bulk Deletion Restricted',
        message: `The following selected staff members are active and must be suspended first: ${namesList}. Please suspend them before deleting.`,
        status: 'BulkBlocker',
        onConfirm: null,
        activeStaff: activeStaff,
        suspensionReason: '',
        error: ''
      });
    } else {
      setDeleteConfirmConfig({
        isOpen: true,
        title: 'Confirm Bulk Deletion',
        message: `Are you sure you want to permanently delete the ${selectedStaffIds.length} selected staff members?`,
        status: 'Normal',
        onConfirm: () => {
          bulkDeleteUsers(selectedStaffIds)
            .then(() => {
              setSelectedStaffIds([]);
              fetchStaff();
              showToast("Selected staff members deleted successfully.", "success");
              setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
            })
            .catch((err) => {
              console.error("Error bulk deleting staff members:", err);
              showToast(err.response?.data?.message || "Failed to delete staff members.", "error");
              setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
            });
        }
      });
    }
  };

  const openEditModal = (member) => {
    setSelectedStaff(member);
    setIsModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            Staff Members
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Manage your internal team accounts, roles, and project access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          {selectedStaffIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-red-200 hover:border-red-400 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium transition-all duration-150 cursor-pointer animate-fade-in"
              title="Bulk Delete selected staff members"
             aria-label="Bulk Delete selected staff members">
              <Trash2 size={15} />
              Delete ({selectedStaffIds.length})
            </button>
          )}

          {/* Export to Excel */}
          <button
            onClick={handleExport}
            disabled={filteredStaff.length === 0}
            title={filteredStaff.length === 0 ? "No data available to export!" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-[--radius-md] border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label={filteredStaff.length === 0 ? "No data available to export!" : "Export to Excel"}>
            <Download size={15} />
            Export Data
          </button>

          {/* Import Staff Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[#CBD5E1] text-[#475569] bg-white hover:bg-[#F1F5F9] hover:border-[#94A3B8] text-sm font-medium transition-all duration-150 cursor-pointer"
          >
            <Upload size={15} />
            Import Staff
          </button>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border text-sm font-medium transition-all duration-150 cursor-pointer ${
              showFilters
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'border-[#CBD5E1] text-[#475569] bg-white hover:bg-[#F1F5F9] hover:border-[#94A3B8]'
            }`}
          >
            <Filter size={15} />
            Filter
          </button>
          
          {/* New Staff Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-[#4F46E5] text-sm font-medium text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer shadow-sm flex-1 sm:flex-none"
          >
            <Plus size={16} />
            New Staff
          </button>
        </div>
      </div>

      {/* Filters Section (Toggled) */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm transition-all duration-200">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[2.375rem] pl-9 pr-4 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all"
             aria-label="Search by name or email..."/>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <SlidersHorizontal size={16} className="text-[#64748B]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[2.375rem] px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all cursor-pointer"
             aria-label="Select h-[2.375rem] px-3 rounded-lg border border-[# c b d5 e1] bg-white text-sm text-[#0 f172 a] outline-none focus:border-[#4 f46 e5] focus:ring-[3px] focus:ring-[#4 f46 e5]/12 transition-all cursor-pointer">
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <svg className="animate-spin h-8 w-8 text-[#4F46E5] mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs text-slate-505 font-semibold">Loading staff members...</span>
        </div>
      ) : (
        /* Staff Table Container */
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div 
            className="overflow-x-auto overflow-y-hidden"
            style={{ paddingBottom: activeDropdownId ? '140px' : '0px' }}
          >
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th scope="col" className="py-3.5 pl-5 pr-2 w-10 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer"
                      checked={filteredStaff.length > 0 && selectedStaffIds.length === filteredStaff.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStaffIds(filteredStaff.map(s => s.id));
                        } else {
                          setSelectedStaffIds([]);
                        }
                      }}
                     aria-label="Rounded border-slate-300 text-[#4 F46 E5] focus:ring-[#4 F46 E5]/30 cursor-pointer"/>
                  </th>
                  <th scope="col" className="text-left py-3.5 px-5 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Staff Member
                  </th>
                  <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Contact
                  </th>
                  <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Status
                  </th>
                  <th scope="col" className="text-center py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedStaff.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC]/50 transition-colors"
                  >
                    <td className="py-4 pl-5 pr-2 w-10 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer"
                        checked={selectedStaffIds.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStaffIds(prev => [...prev, member.id]);
                          } else {
                            setSelectedStaffIds(prev => prev.filter(id => id !== member.id));
                          }
                        }}
                       aria-label="Rounded border-slate-300 text-[#4 F46 E5] focus:ring-[#4 F46 E5]/30 cursor-pointer"/>
                    </td>
                    {/* Staff Avatar, Name & Initials */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0 shadow-xs border border-slate-100"
                            width={36}
                            height={36}
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: member.avatarColor || '#6366F1' }}
                          >
                            {member.initials}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A] font-display">
                            {member.name}
                          </p>
                          <span className="inline-block bg-[#F8FAFC] border border-[#CBD5E1] px-2 py-0.5 rounded text-[9px] font-bold text-[#64748B] mt-1 tracking-wider uppercase">
                            {member.role || 'STAFF'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-4 px-4">
                      <p className="text-xs font-semibold text-[#334155]">{member.email}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">{member.phone}</p>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <StatusBadge status={member.status} />
                    </td>

                    {/* Actions Dots Menu */}
                    <td className="py-4 px-4 text-center relative">
                      <button 
                        onClick={() => setActiveDropdownId(activeDropdownId === member.id ? null : member.id)}
                        className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#475569] cursor-pointer transition-colors"
                        aria-label="Actions dropdown"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdownId === member.id && (
                        <div 
                          ref={dropdownRef}
                          className="absolute right-4 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 text-left animate-fade-in"
                        >
                          <button
                            onClick={() => openEditModal(member)}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <Edit2 size={13} className="text-slate-400" />
                            Edit Details
                          </button>
                          {member.status === "Suspended" ? (
                            <button
                              onClick={() => handleReactivateUser(member)}
                              className="w-full px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50"
                            >
                              <UserCheck size={13} className="text-emerald-500" />
                              Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                setSuspensionConfirmUser(member);
                                setSuspensionReason('');
                                setSuspensionError('');
                              }}
                              className="w-full px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50"
                            >
                               <Ban size={13} className="text-amber-500" />
                               Suspend
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(member.id, member.name)}
                            className="w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50"
                          >
                            <Trash2 size={13} className="text-rose-400" />
                            Delete Member
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {paginatedStaff.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-sm text-[#64748B] font-medium">
                      No staff members match your filters
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
              totalItems={filteredStaff.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}

      {/* New/Edit Staff Overlay Modal */}
      <NewStaffModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveStaff}
        staffToEdit={selectedStaff}
      />

      {/* Import Staff Overlay Modal */}
      <ImportStaffModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchStaff}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmConfig.isOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm max-h-[90vh] overflow-y-auto animate-scale-up p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <span className="p-2 bg-rose-50 rounded-full shrink-0">
                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <h3 className="text-base font-bold text-slate-900 font-display">{deleteConfirmConfig.title}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              {deleteConfirmConfig.message}
            </p>

            {(deleteConfirmConfig.status === 'Blocker' || deleteConfirmConfig.status === 'BulkBlocker') && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Provide Suspension Reason
                  </label>
                  <textarea
                    value={deleteConfirmConfig.suspensionReason || ''}
                    onChange={(e) => {
                      const reason = e.target.value;
                      setDeleteConfirmConfig(prev => ({
                        ...prev,
                        suspensionReason: reason,
                        error: reason.trim() ? '' : prev.error
                      }));
                    }}
                    placeholder="e.g. Inactive account, violation of policies, etc."
                    className={deleteConfirmConfig.error ? "w-full min-h-[80px] p-2.5 text-xs border border-rose-500 focus:ring-rose-500/12 rounded-lg outline-none focus:border-rose-500 focus:ring-2 transition-all placeholder:text-slate-400 resize-none font-sans" : "w-full min-h-[80px] p-2.5 text-xs border border-slate-300 focus:ring-rose-500/12 rounded-lg outline-none focus:border-rose-500 focus:ring-2 transition-all placeholder:text-slate-400 resize-none font-sans"}
                    required
                   aria-label="e.g. Inactive account, violation of policies, etc."/>
                  {deleteConfirmConfig.error && (
                    <p className="text-[10px] text-rose-600 font-semibold mt-1.5 animate-fade-in">
                      {deleteConfirmConfig.error}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {deleteConfirmConfig.status === 'Blocker' ? (
                <button
                  onClick={() => handleSuspendFromBlocker(deleteConfirmConfig.userId, deleteConfirmConfig.suspensionReason)}
                  className="px-4 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Suspend Account
                </button>
              ) : deleteConfirmConfig.status === 'BulkBlocker' ? (
                <button
                  onClick={() => handleBulkSuspendFromBlocker(deleteConfirmConfig.activeStaff, deleteConfirmConfig.suspensionReason)}
                  className="px-4 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Suspend Active Staff
                </button>
              ) : (
                <button
                  onClick={deleteConfirmConfig.onConfirm}
                  className="px-4 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suspension Confirmation Modal */}
      {suspensionConfirmUser && (
        <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4 animate-scale-up">
            <div className="flex items-center gap-2.5 text-rose-600">
              <span className="p-2 bg-rose-50 rounded-full shrink-0">
                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <h4 className="text-sm font-bold font-display">Confirm Account Suspension</h4>
            </div>
            
            <p className="text-xs text-slate-500 leading-normal">
              Are you sure you want to suspend the account of <strong>{suspensionConfirmUser.name || suspensionConfirmUser.fullName}</strong>? The user will be immediately blocked from logging in.
            </p>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Suspension Reason
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => {
                  setSuspensionReason(e.target.value);
                  if (e.target.value.trim()) setSuspensionError('');
                }}
                placeholder="e.g. Violation of platform policies, outstanding payments, etc."
                className={suspensionError ? "w-full min-h-[80px] p-2.5 text-xs border border-rose-500 focus:ring-rose-500/12 rounded-lg outline-none focus:border-rose-500 focus:ring-2 transition-all placeholder:text-slate-400 resize-none font-sans" : "w-full min-h-[80px] p-2.5 text-xs border border-slate-300 focus:ring-rose-500/12 rounded-lg outline-none focus:border-rose-500 focus:ring-2 transition-all placeholder:text-slate-400 resize-none font-sans"}
                required
               aria-label="e.g. Violation of platform policies, outstanding payments, etc."/>
              {suspensionError && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1.5 animate-fade-in">
                  {suspensionError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setSuspensionConfirmUser(null);
                  setSuspensionReason('');
                  setSuspensionError('');
                }}
                className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspension}
                className="px-4 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStaff;
