// Home console for clients displaying project timelines and deliverables.
// Coordinates shortcuts notifications.


import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSelector } from "react-redux";
import WelcomeBanner from "../../components/client/WelcomeBanner";
import StatCard from "../../components/client/StatCard";
import * as clientProfileService from "../../services/clientProfileService";

const ProjectTimelineGantt = React.lazy(() => import("../../components/dashboard/ProjectTimelineGantt"));

const QuickActions = React.lazy(() => import("../../components/client/QuickActions"));
const ActivityFeed = React.lazy(() => import("../../components/client/ActivityFeed"));
const ProjectProgress = React.lazy(() => import("../../components/client/ProjectProgress"));
const NotificationsWidget = React.lazy(() => import("../../components/client/NotificationsWidget"));

import { getProjects } from "../../services/projectService";
import { getDeliverables } from "../../services/deliverableService";
import { getInvoices } from "../../services/invoiceService";
import { getTickets } from "../../services/ticketService";

export default function ClientDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [projects, setProjects] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [pendingInvoicesCount, setPendingInvoicesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const [tickets, setTickets] = useState(null);
  const [renderLazy, setRenderLazy] = useState(false);

  const fetchCoreData = useCallback(async () => {
    try {
      // Fetch Profile
      try {
        const profileRes = await clientProfileService.getClientProfile();
        if (profileRes.success) {
          setProfile(profileRes.data);
        }
      } catch (profileErr) {
        console.error("Error loading profile:", profileErr);
      }

      // Fetch Projects
      const projectsRes = await getProjects();
      const clientProjs = projectsRes.data?.data || [];
      setProjects(clientProjs);
    } catch (err) {
      console.error("Error loading client projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch core data (Profile and Projects)
  useEffect(() => {
    fetchCoreData();

    // Trigger lazy rendering delay
    const lazyTimer = setTimeout(() => {
      setRenderLazy(true);
    }, 100);

    return () => clearTimeout(lazyTimer);
  }, []);

  // Fetch secondary data (Deliverables, Tickets, Invoices)
  useEffect(() => {
    if (loading) return; // Wait until projects are fetched

    const fetchSecondaryData = async () => {
      try {
        // Fetch deliverables for each project to count pending reviews
        const promises = projects.map(p => getDeliverables(p.id));
        const results = await Promise.all(promises);
        
        let pending = 0;
        results.forEach(r => {
          if (r.data?.data) {
            pending += r.data.data.filter(d => d.status === "Awaiting Review").length;
          }
        });
        setPendingCount(pending);
      } catch (err) {
        console.error("Error loading deliverables count:", err);
      }

      // Fetch Tickets count
      try {
        const ticketsRes = await getTickets();
        const list = ticketsRes.data || [];
        setTickets(list);
        const openCount = list.filter(t => t.status !== "Closed" && t.status !== "Resolved").length;
        setOpenTicketsCount(openCount);
      } catch (ticketErr) {
        console.error("Error loading tickets count:", ticketErr);
      }

      // Fetch Invoices count
      try {
        const invoicesRes = await getInvoices();
        const list = invoicesRes.data?.data || [];
        setInvoices(list);
        const unpaidCount = list.filter(i => i.status === "Unpaid").length;
        setPendingInvoicesCount(unpaidCount);
      } catch (invoiceErr) {
        console.error("Error loading invoices count:", invoiceErr);
      }
    };

    // Defer the secondary requests by 100ms
    const timer = setTimeout(fetchSecondaryData, 100);
    return () => clearTimeout(timer);
  }, [loading, projects]);

  const activeProjects = React.useMemo(() => projects.filter(p => p.status !== "Completed"), [projects]);
  const firstProjectName = React.useMemo(() => projects.length > 0 ? projects[0].name : "No Projects Assigned", [projects]);
  const avgProgress = React.useMemo(() => projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
    : 0, [projects]);

  // Format projects for ProjectProgress
  const formattedProjects = React.useMemo(() => projects.map(p => ({
    name: p.name,
    progress: p.progress,
    deadline: p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "N/A"
  })), [projects]);

  const clientName = profile?.fullName || user?.fullName || "Valued Client";
  const displayProjectName = loading ? "Loading..." : firstProjectName;

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Greeting Banner */}
      <WelcomeBanner clientName={clientName} projectName={displayProjectName} />

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Active Projects" value={loading ? "..." : activeProjects.length.toString()} type="primary" to="/client/projects" />
        <StatCard label="Project Progress" value={loading ? "..." : `${avgProgress}%`} type="success" to="/client/projects" />
        <StatCard label="Pending Deliverables" value={loading ? "..." : pendingCount.toString()} type="warning" to="/client/deliverables" />
        <StatCard label="Open Tickets" value={loading ? "..." : openTicketsCount.toString()} type="info" to="/client/support-tickets" />
        <div className="col-span-2 sm:col-span-1 flex">
          <StatCard label="Pending Invoices" value={loading ? "..." : pendingInvoicesCount.toString()} type="danger" to="/client/invoices" />
        </div>
      </div>

      {/* Project Timeline & Gantt Widget */}
      <Suspense fallback={
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-64 animate-pulse flex items-center justify-center">
          <span className="text-xs text-slate-400">Loading project timeline...</span>
        </div>
      }>
        <ProjectTimelineGantt
          projects={projects}
          loading={loading}
          userRole="CLIENT"
          onRefresh={fetchCoreData}
        />
      </Suspense>

      {/* Responsive Grid layout for widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[420px]">
        {/* Left Column widgets */}
        <div className="lg:col-span-2 space-y-6">
          {renderLazy ? (
            <Suspense fallback={
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-96 animate-pulse flex items-center justify-center">
                <span className="text-xs text-slate-400">Loading project progress...</span>
              </div>
            }>
              <ProjectProgress projects={formattedProjects} loading={loading} />
              <QuickActions />
            </Suspense>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-96 animate-pulse flex items-center justify-center">
              <span className="text-xs text-slate-400">Loading project progress...</span>
            </div>
          )}
        </div>

        {/* Right Column widgets */}
        <div className="lg:col-span-1 space-y-6">
          {renderLazy ? (
            <Suspense fallback={
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-96 animate-pulse flex items-center justify-center">
                <span className="text-xs text-slate-400">Loading activities & alerts...</span>
              </div>
            }>
              <ActivityFeed projectId={projects.length > 0 ? projects[0].id : null} />
              <NotificationsWidget 
                invoices={invoices}
                tickets={tickets}
                deliverablesCount={pendingCount}
                loading={loading}
              />
            </Suspense>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-96 animate-pulse flex items-center justify-center">
              <span className="text-xs text-slate-400">Loading activities & alerts...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
