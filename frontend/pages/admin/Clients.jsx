import { useToast } from '../../context/ToastContext';
// Portal page for managing client accounts, company relationships, and status updates.
// Handles client directories.

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Filter, MoreHorizontal, SlidersHorizontal, Search, Edit2, Trash2, Download, Upload, Ban, UserCheck } from 'lucide-react';
import { exportToExcel } from '../../utils/excelExport';
import StatusBadge from '../../components/common/StatusBadge';
import NewClientModal from '../../components/clients/NewClientModal';
import ImportClientsModal from '../../components/clients/ImportClientsModal';
import { getClients, createClient } from '../../services/clientService';
import { updateUser, deleteUser, bulkDeleteUsers } from '../../services/authService';
import Pagination from '../../components/common/Pagination';

// Renders list grid tables of user clients profiles and onboarding details
function AdminClients() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const searchParamVal = searchParams.get('search') || '';
  const [clients, setClients] = useState([]);
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParamVal);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchQuery(q);
  }, [searchParams]);

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
      if (filteredClients.length === 0) {
        showToast("No data available to export!", "error");
        return;
      }
      const mapped = filteredClients.map(client => ({
        "Client Name": client.name || '',
        "Client / Company": client.company || '',
        "Email": client.email || '',
        "Phone": client.phone || '',
        "Active Projects": client.activeProjects || 0,
        "Status": client.status || '',
        "Added On": client.addedOn || ''
      }));
      exportToExcel(mapped, "Clients");
    } catch (err) {
      console.error("Failed to export clients:", err);
      showToast("Failed to export clients data.", "error");
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

  // Fetch clients from Neon database
  const fetchClients = useCallback(() => {
    setLoading(true);
    getClients()
      .then((res) => {
        setClients(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading clients:", err);
        setLoading(false);
      });
  }, []);

  // Triggers list data fetch on filter change or pagination switches
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        (client.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        statusFilter === 'All' || client.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / ITEMS_PER_PAGE));

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClients.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClients, currentPage]);

  const handleSaveClient = (clientData) => {
    if (selectedClient) {
      // Edit mode
      return updateUser(selectedClient.id, clientData)
        .then(() => {
          setSelectedClient(null);
          fetchClients();
          showToast("Client updated successfully.", "success");
        })
        .catch((err) => {
          console.error("Error updating client:", err);
          showToast(err.response?.data?.message || "Failed to update client.", "error");
          throw err;
        });
    } else {
      // Create mode
      return createClient({
        name: clientData.name,
        company: clientData.company,
        email: clientData.email,
        phone: clientData.phone,
        status: clientData.status,
        password: clientData.password || "client123"
      })
        .then(() => {
          fetchClients();
          showToast("Client created successfully.", "success");
        })
        .catch((err) => {
          console.error("Error creating client:", err);
          showToast(err.response?.data?.message || "Failed to create client.", "error");
          throw err;
        });
    }
  };

  // Open delete confirmation modal
  // Open delete confirmation modal
  const handleDeleteClick = (id, name) => {
    setActiveDropdownId(null);
    const target = clients.find(c => c.id === id);
    if (target && target.status !== 'Suspended') {
      setDeleteConfirmConfig({
        isOpen: true,
        title: 'Suspension Required',
        message: `Account for client ${name} must be suspended before deletion.`,
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
        message: `Are you sure you want to permanently delete client ${name}? This action cannot be undone.`,
        userId: id,
        userName: name,
        status: 'Normal',
        onConfirm: () => {
          deleteUser(id)
            .then(() => {
              fetchClients();
              showToast("Client deleted successfully.", "success");
              setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
            })
            .catch((err) => {
              console.error("Error deleting client:", err);
              showToast(err.response?.data?.message || "Failed to delete client.", "error");
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
        fetchClients();
        showToast("Client account suspended successfully.", "success");
        setDeleteConfirmConfig(prev => ({
          ...prev,
          title: 'Confirm Deletion',
          message: `Account suspended successfully! Are you sure you want to permanently delete client ${prev.userName}? This action cannot be undone.`,
          status: 'Normal',
          onConfirm: () => {
            deleteUser(id)
              .then(() => {
                fetchClients();
                showToast("Client deleted successfully.", "success");
                setDeleteConfirmConfig(p => ({ ...p, isOpen: false }));
              })
              .catch((err) => {
                console.error("Error deleting client:", err);
                showToast(err.response?.data?.message || "Failed to delete client.", "error");
                setDeleteConfirmConfig(p => ({ ...p, isOpen: false }));
              });
          }
        }));
      })
      .catch((err) => {
        console.error("Error suspending client:", err);
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
        fetchClients();
        showToast("Client account reactivated successfully.", "success");
      })
      .catch((err) => {
        console.error("Error reactivating client:", err);
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
        fetchClients();
        showToast("Client account suspended successfully.", "success");
      })
      .catch((err) => {
        console.error("Error suspending client:", err);
        showToast(err.response?.data?.message || "Failed to suspend account.", "error");
      });
  };

  const handleBulkSuspendFromBlocker = async (activeClients, reason) => {
    if (!reason || !reason.trim()) {
      setDeleteConfirmConfig(prev => ({ ...prev, error: 'Please provide a suspension reason.' }));
      return;
    }

    try {
      await Promise.all(
        activeClients.map(c => 
          updateUser(c.id, {
            status: 'Suspended',
            suspensionReason: reason
          })
        )
      );

      fetchClients();
      showToast("Active clients suspended successfully.", "success");

      setDeleteConfirmConfig(prev => ({
        ...prev,
        title: 'Confirm Bulk Deletion',
        message: `All selected active clients have been suspended! Are you sure you want to permanently delete the ${selectedClientIds.length} selected clients? This action will cascade to all invoices, tickets, and transactions belonging to these clients.`,
        status: 'Normal',
        onConfirm: () => {
          bulkDeleteUsers(selectedClientIds)
            .then(() => {
              setSelectedClientIds([]);
              fetchClients();
              showToast("Selected clients deleted successfully.", "success");
              setDeleteConfirmConfig(p => ({ ...p, isOpen: false }));
            })
            .catch((err) => {
              console.error("Error bulk deleting clients:", err);
              showToast(err.response?.data?.message || "Failed to delete clients.", "error");
              setDeleteConfirmConfig(p => ({ ...p, isOpen: false }));
            });
        }
      }));
    } catch (err) {
      console.error("Error bulk suspending clients:", err);
      showToast(err.response?.data?.message || "Failed to suspend active clients.", "error");
    }
  };

  // Removes multiple selected client profiles in a single bulk transaction
  const handleBulkDelete = () => {
    const activeClients = clients.filter(c => selectedClientIds.includes(c.id) && c.status !== 'Suspended');
    
    if (activeClients.length > 0) {
      const namesList = activeClients.map(c => c.fullName || c.name).join(', ');
      setDeleteConfirmConfig({
        isOpen: true,
        title: 'Bulk Deletion Restricted',
        message: `The following selected clients are active and must be suspended first: ${namesList}. Please suspend them before deleting.`,
        status: 'BulkBlocker',
        onConfirm: null,
        activeClients: activeClients,
        suspensionReason: '',
        error: ''
      });
    } else {
      setDeleteConfirmConfig({
        isOpen: true,
        title: 'Confirm Bulk Deletion',
        message: `Are you sure you want to permanently delete the ${selectedClientIds.length} selected clients? This action will cascade to all invoices, tickets, and transactions belonging to these clients.`,
        status: 'Normal',
        onConfirm: () => {
          bulkDeleteUsers(selectedClientIds)
            .then(() => {
              setSelectedClientIds([]);
              fetchClients();
              showToast("Selected clients deleted successfully.", "success");
              setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
            })
            .catch((err) => {
              console.error("Error bulk deleting clients:", err);
              showToast(err.response?.data?.message || "Failed to delete clients.", "error");
              setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
            });
        }
      });
    }
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
    setActiveDropdownId(null);
  };

  // Resets client form inputs and closes modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            Clients
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Manage your client relationships and access
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          {selectedClientIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-red-200 hover:border-red-400 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium transition-all duration-150 cursor-pointer"
              title="Bulk Delete selected clients"
             aria-label="Bulk Delete selected clients">
              <Trash2 size={15} />
              Delete ({selectedClientIds.length})
            </button>
          )}

          {/* Export to Excel */}
          <button
            onClick={handleExport}
            disabled={filteredClients.length === 0}
            title={filteredClients.length === 0 ? "No data available to export!" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-[--radius-md] border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label={filteredClients.length === 0 ? "No data available to export!" : "Export to Excel"}>
            <Download size={15} />
            Export Data
          </button>

          {/* Import Clients Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[#CBD5E1] text-[#475569] bg-white hover:bg-[#F1F5F9] hover:border-[#94A3B8] text-sm font-medium transition-all duration-150 cursor-pointer"
          >
            <Upload size={15} />
            Import Clients
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
          
          {/* New Client Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-[#4F46E5] text-sm font-medium text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer shadow-sm flex-1 sm:flex-none"
          >
            <Plus size={16} />
            New Client
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
              placeholder="Search by name, company, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[2.375rem] pl-9 pr-4 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all"
             aria-label="Search by name, company, or email..."/>
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
              <option value="Pending Review">Pending Review</option>
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
          <span className="text-xs text-slate-505 font-semibold">Loading clients...</span>
        </div>
      ) : (
        /* Clients Table Container */
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div 
            className="overflow-x-auto overflow-y-hidden"
            style={{ paddingBottom: activeDropdownId ? '140px' : '0px' }}
          >
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th scope="col" className="py-3.5 pl-5 pr-2 w-10 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer"
                      checked={filteredClients.length > 0 && selectedClientIds.length === filteredClients.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClientIds(filteredClients.map(c => c.id));
                        } else {
                          setSelectedClientIds([]);
                        }
                      }}
                     aria-label="Rounded border-slate-300 text-[#4 F46 E5] focus:ring-[#4 F46 E5]/30 cursor-pointer"/>
                  </th>
                  <th scope="col" className="text-left py-3.5 px-5 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Client
                  </th>
                  <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Contact
                  </th>
                  <th scope="col" className="text-center py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Active Projects
                  </th>
                  <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Status
                  </th>
                  <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Added On
                  </th>
                  <th scope="col" className="text-center py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC]/50 transition-colors"
                  >
                    <td className="py-4 pl-5 pr-2 w-10 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer"
                        checked={selectedClientIds.includes(client.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClientIds(prev => [...prev, client.id]);
                          } else {
                            setSelectedClientIds(prev => prev.filter(id => id !== client.id));
                          }
                        }}
                       aria-label="Rounded border-slate-300 text-[#4 F46 E5] focus:ring-[#4 F46 E5]/30 cursor-pointer"/>
                    </td>
                    {/* Client Avatar, Name & Company */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {client.avatar ? (
                          <img
                            src={client.avatar}
                            alt={client.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0 shadow-xs border border-slate-100"
                            width={36}
                            height={36}
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: client.avatarColor || '#6366F1' }}
                          >
                            {client.initials}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A] font-display">
                            {client.name}
                          </p>
                          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                            {client.company}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-4 px-4">
                      <p className="text-xs font-semibold text-[#334155]">{client.email}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">{client.phone}</p>
                    </td>

                    {/* Active Projects Count */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E0F2FE] text-[#0369A1] text-[11px] font-bold">
                        {client.activeProjects}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <StatusBadge status={client.status} />
                    </td>

                    {/* Added On Date */}
                    <td className="py-4 px-4">
                      <span className="text-xs font-medium text-[#475569]">{client.addedOn}</span>
                    </td>

                    {/* Actions Dots Menu */}
                    <td className="py-4 px-4 text-center relative">
                      <button 
                        onClick={() => setActiveDropdownId(activeDropdownId === client.id ? null : client.id)}
                        className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#475569] cursor-pointer transition-colors"
                        aria-label="Actions dropdown"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdownId === client.id && (
                        <div 
                          ref={dropdownRef}
                          className="absolute right-4 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 text-left animate-fade-in"
                        >
                          <button
                            onClick={() => openEditModal(client)}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <Edit2 size={13} className="text-slate-400" />
                            Edit Details
                          </button>
                          {client.status === "Suspended" ? (
                            <button
                              onClick={() => handleReactivateUser(client)}
                              className="w-full px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50"
                            >
                              <UserCheck size={13} className="text-emerald-500" />
                              Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                setSuspensionConfirmUser(client);
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
                            onClick={() => handleDeleteClick(client.id, client.fullName || client.name)}
                            className="w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50"
                          >
                            <Trash2 size={13} className="text-rose-400" />
                            Delete Client
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {paginatedClients.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-sm text-[#64748B] font-medium">
                      No client relationships match your filters
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
              totalItems={filteredClients.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}

      {/* New/Edit Client Overlay Modal */}
      <NewClientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveClient}
        clientToEdit={selectedClient}
      />

      {/* Import Clients Overlay Modal */}
      <ImportClientsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchClients}
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
                  onClick={() => handleBulkSuspendFromBlocker(deleteConfirmConfig.activeClients, deleteConfirmConfig.suspensionReason)}
                  className="px-4 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Suspend Active Clients
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

export default AdminClients;
