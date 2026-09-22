// Renders filter selections for project lists.
// Sorts records by priorities or statuses.

import { useState, useEffect } from 'react';
import { ChevronDown, Calendar, Filter } from 'lucide-react';
import { getClients } from '../../services/clientService';

const statusOptions = ['All Statuses', 'In Progress', 'Planning', 'Review', 'Completed', 'On Hold'];

function ProjectFilters({ status, client, search, onStatusChange, onClientChange, onSearchChange, showClientFilter = true }) {
  const [clients, setClients] = useState([]);

  // Queries user collections and company metadata options to initialize selectors
  useEffect(() => {
    if (showClientFilter) {
      getClients()
        .then((res) => {
          const companies = (res.data?.data || [])
            .map((c) => c.company)
            .filter((c) => c && c.trim() !== "");
          const uniqueCompanies = Array.from(new Set(companies)).sort();
          setClients(uniqueCompanies);
        })
        .catch((err) => console.error("Error loading filter clients:", err));
    }
  }, [showClientFilter]);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="appearance-none h-[2.375rem] pl-3 pr-8 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all duration-150 cursor-pointer"
            aria-label="Filter projects by status"
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
        </div>

        {/* Client Dropdown */}
        {showClientFilter && (
          <div className="relative">
            <select
              value={client}
              onChange={(e) => onClientChange(e.target.value)}
              className="appearance-none h-[2.375rem] pl-3 pr-8 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all duration-150 cursor-pointer"
              aria-label="Filter projects by client company"
            >
              <option value="All Clients">All Clients</option>
              {clients.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
          </div>
        )}

        {/* Date Button */}
        <button className="flex items-center gap-2 h-[2.375rem] px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-all duration-150 cursor-pointer">
          <Calendar size={16} className="text-[#64748B]" />
          <span>Any Date</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Filter current view..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-[2.375rem] pl-9 pr-4 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition-all duration-150 focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12"
         aria-label="Filter current view..."/>
      </div>
    </div>
  );
}

export default ProjectFilters;
