// Global search input enabling administrators to find tasks or client files.
// Supports keyword lookups.


import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase, ListChecks, FileText, Headphones, Loader2, User } from 'lucide-react';
import API from '../../services/api';

function NavbarSearch({ portal = 'admin', onNavigate }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await API.get(`/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.data && res.data.success) {
          setSearchResults(res.data.data);
        }
      } catch (err) {
        console.error("Search API error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleResultClick = (type, item) => {
    setShowSearchResults(false);
    setSearchQuery('');

    // If a custom navigation handler is passed (e.g. staff portal views state changes)
    if (onNavigate) {
      onNavigate(type, item);
      return;
    }

    // Default router-based navigation
    if (portal === 'admin') {
      if (type === 'project') {
        navigate(`/admin/projects/${item.id}`);
      } else if (type === 'task') {
        navigate(`/admin/tasks?search=${item.taskKey}`);
      } else if (type === 'user') {
        if (item.role === 'CLIENT') {
          navigate(`/admin/clients?search=${item.fullName}`);
        } else {
          navigate(`/admin/staff`);
        }
      } else if (type === 'invoice') {
        navigate(`/admin/invoices?search=${item.invoiceNumber}`);
      } else if (type === 'ticket') {
        navigate(`/admin/support`);
      }
    } else if (portal === 'client') {
      if (type === 'project') {
        navigate(`/client/projects/${item.id}`);
      } else if (type === 'task') {
        navigate(`/client/projects/${item.projectId}`);
      } else if (type === 'invoice') {
        navigate(`/client/invoices`);
      } else if (type === 'ticket') {
        navigate(`/client/support-tickets`);
      }
    }
  };

  return (
    <div className="relative w-full max-w-[200px] md:max-w-xs ml-auto mr-4 md:mr-0 hidden md:block" ref={searchRef}>
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
      />
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setShowSearchResults(true);
        }}
        onFocus={() => setShowSearchResults(true)}
        className="w-full h-[2.375rem] pl-10 pr-4 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition-all duration-150 focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12"
        aria-label="Search portal records"
      />

      {showSearchResults && searchQuery.trim() !== "" && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden font-sans max-h-[380px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          {searchLoading && (
            <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
              <Loader2 size={16} className="animate-spin text-[#4F46E5]" />
              <span className="text-xs font-semibold">Searching...</span>
            </div>
          )}
          
          {!searchLoading && searchResults && (
            <>
              {Object.values(searchResults).every(arr => arr.length === 0) ? (
                <div className="p-4 text-center text-slate-500 text-xs font-medium">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <div className="p-2 space-y-3">
                  {/* Projects */}
                  {searchResults.projects && searchResults.projects.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-50 mb-1">
                        <Briefcase size={12} className="text-indigo-500" />
                        Projects
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.projects.map((proj) => (
                          <button
                            key={proj.id}
                            onClick={() => handleResultClick('project', proj)}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex flex-col border-none bg-transparent"
                          >
                            <span className="text-slate-900 font-bold truncate">{proj.name}</span>
                            {proj.description && (
                              <span className="text-[11px] text-slate-450 truncate mt-0.5">
                                {proj.description}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks */}
                  {searchResults.tasks && searchResults.tasks.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-50 mb-1">
                        <ListChecks size={12} className="text-emerald-500" />
                        Tasks
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.tasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => handleResultClick('task', task)}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex flex-col border-none bg-transparent"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-slate-900 font-bold truncate">{task.title}</span>
                              <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">{task.taskKey}</span>
                            </div>
                            {task.description && (
                              <span className="text-[11px] text-slate-450 truncate mt-0.5">
                                {task.description}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Users */}
                  {searchResults.users && searchResults.users.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-50 mb-1">
                        <User size={12} className="text-amber-500" />
                        Users
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.users.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => handleResultClick('user', u)}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex flex-col border-none bg-transparent"
                          >
                            <span className="text-slate-900 font-bold truncate">{u.fullName}</span>
                            <span className="text-[11px] text-slate-450 truncate mt-0.5 flex items-center gap-1.5">
                              <span className="uppercase font-bold text-slate-400 tracking-wider text-[8px] bg-slate-100 px-1 py-0.25 rounded">
                                {u.role}
                              </span>
                              {u.email}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Invoices */}
                  {searchResults.invoices && searchResults.invoices.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-50 mb-1">
                        <FileText size={12} className="text-rose-500" />
                        Invoices
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.invoices.map((inv) => (
                          <button
                            key={inv.id}
                            onClick={() => handleResultClick('invoice', inv)}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex flex-col border-none bg-transparent"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-slate-900 font-bold truncate">{inv.invoiceNumber}</span>
                              <span className="text-[11px] font-bold text-rose-600 shrink-0">₹{inv.amount.toLocaleString()}</span>
                            </div>
                            {inv.description && (
                              <span className="text-[11px] text-slate-450 truncate mt-0.5">
                                {inv.description}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tickets */}
                  {searchResults.tickets && searchResults.tickets.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-50 mb-1">
                        <Headphones size={12} className="text-sky-500" />
                        Tickets
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.tickets.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleResultClick('ticket', t)}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex flex-col border-none bg-transparent"
                          >
                            <span className="text-slate-900 font-bold truncate">{t.subject}</span>
                            {t.description && (
                              <span className="text-[11px] text-slate-450 truncate mt-0.5">
                                {t.description}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default NavbarSearch;
