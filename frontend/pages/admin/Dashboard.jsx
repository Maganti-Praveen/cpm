// Administrative landing page displaying operational stats, checklists, and deadline charts.
// Connects key system metrics.


import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickActions from '../../components/dashboard/QuickActions';
import StatCard from '../../components/dashboard/StatCard';
import ProjectsOverview from '../../components/dashboard/ProjectsOverview';
import UpcomingDeadlines from '../../components/dashboard/UpcomingDeadlines';
import RecentActivity from '../../components/dashboard/RecentActivity';
import ProjectTimelineGantt from '../../components/dashboard/ProjectTimelineGantt';
import API from '../../services/api';

// Import Modals
import NewProjectModal from '../../components/projects/NewProjectModal';
import NewClientModal from '../../components/clients/NewClientModal';
import NewTaskModal from '../../components/tasks/NewTaskModal';

// Import Services
import { createProject } from '../../services/projectService';
import { createClient } from '../../services/clientService';
import { createTask } from '../../services/taskService';

// Coordinates global stats overview maps, checklists and system logs
function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals Visibility State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Metadata needed for creating tasks
  const [projectsList, setProjectsList] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Queries system metrics to update overview widget metrics
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/dashboard/summary');
      setData(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard metrics');
      setLoading(false);
    }
  };

  // Loads project and staff metadata lists needed for task creation dropdown selectors
  const fetchMetadataForTask = async () => {
    try {
      const [projRes, userRes] = await Promise.all([
        API.get('/projects'),
        API.get('/users', { params: { role: 'STAFF' } })
      ]);
      setProjectsList(projRes.data.data || []);
      setStaffList(userRes.data.data || []);
    } catch (err) {
      console.error("Failed to load task metadata:", err);
    }
  };

  // Triggers initial preloads of statistics and task dropdown parameters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Submits project creation forms configuration to api endpoint
  const handleCreateProject = useCallback(async (newProj) => {
    try {
      await createProject(newProj);
      await fetchDashboardData();
      setIsProjectModalOpen(false);
    } catch (err) {
      console.error("Error creating project:", err);
      setError(err.response?.data?.message || 'Failed to create project');
    }
  }, []);

  // Registers client company info data in database and reloads overview metrics
  const handleCreateClient = useCallback(async (clientData) => {
    try {
      await createClient({
        name: clientData.name,
        company: clientData.company,
        email: clientData.email,
        phone: clientData.phone,
        status: clientData.status,
        password: clientData.password || "client123"
      });
      await fetchDashboardData();
      setIsClientModalOpen(false);
    } catch (err) {
      console.error("Error creating client:", err);
      setError(err.response?.data?.message || 'Failed to create client');
    }
  }, []);

  // Dispatches task details configuration payload to task builder API
  const handleCreateTask = useCallback(async (newTask) => {
    try {
      await createTask(newTask);
      await fetchDashboardData();
      setIsTaskModalOpen(false);
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err.response?.data?.message || 'Failed to create task');
    }
  }, []);

  const handleActionClick = useCallback((key) => {
    if (key === 'project') {
      setIsProjectModalOpen(true);
    } else if (key === 'client') {
      setIsClientModalOpen(true);
    } else if (key === 'invoice') {
      navigate('/admin/invoices');
    } else if (key === 'task') {
      fetchMetadataForTask();
      setIsTaskModalOpen(true);
    }
  }, [navigate]);

  const stats = useMemo(() => [
    {
      id: 1,
      label: 'Active Projects',
      value: String(data?.stats?.activeProjects ?? 0),
      subInfo: 'Currently in progress',
      subInfoType: 'success',
      iconName: 'Briefcase',
      to: '/admin/projects',
    },
    {
      id: 2,
      label: 'Open Tasks',
      value: String(data?.stats?.pendingTasks ?? 0),
      subInfo: 'Pending completion',
      subInfoType: 'warning',
      iconName: 'ListChecks',
      to: '/admin/tasks',
    },
    {
      id: 3,
      label: 'Open Tickets',
      value: String(data?.stats?.supportTickets ?? 0),
      subInfo: 'Awaiting resolution',
      subInfoType: 'danger',
      iconName: 'Headphones',
      to: '/admin/support',
    },
    {
      id: 4,
      label: 'Active Clients',
      value: String(data?.stats?.activeClients ?? 0),
      subInfo: 'Registered companies',
      subInfoType: 'success',
      iconName: 'IndianRupee',
      to: '/admin/clients',
    },
  ], [data]);

  return (
    <div>
      {/* Page Header + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
          Dashboard
        </h1>
        <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <QuickActions onActionClick={handleActionClick} />
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-rose-50 border border-rose-100 text-rose-600 rounded-lg px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} loading={loading} />
        ))}
      </div>

      {/* Project Timeline & Gantt Widget */}
      <div className="mb-6">
        <ProjectTimelineGantt
          projects={data?.projects || []}
          loading={loading}
          userRole="ADMIN"
          onRefresh={fetchDashboardData}
        />
      </div>

      {/* Main Content: Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column — 8 cols */}
        <div className="col-span-1 lg:col-span-8 space-y-6">
          <ProjectsOverview projects={data?.projects || []} loading={loading} />
        </div>

        {/* Right Column — 4 cols */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          <UpcomingDeadlines deadlines={data?.deadlines || []} loading={loading} />
          <RecentActivity activities={data?.activities || []} loading={loading} />
        </div>
      </div>

      {/* Modals */}
      <NewProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleCreateProject}
      />
      <NewClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleCreateClient}
      />
      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleCreateTask}
        projects={projectsList}
        assignees={staffList}
      />
    </div>
  );
}

export default AdminDashboard;
