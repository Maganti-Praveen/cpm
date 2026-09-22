// Workspace focusing on tasks, milestone lists, and documents for a project.
// Connects active workspaces.


import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProjectHeader from '../../components/projects/ProjectHeader';
import ProjectTabs from '../../components/projects/ProjectTabs';
import ProjectOverview from '../../components/projects/ProjectOverview';
import TaskDetailPanel from '../../components/projects/TaskDetailPanel';
import StatusBadge from '../../components/common/StatusBadge';
import NewProjectTaskModal from '../../components/projects/NewProjectTaskModal';
import NewMilestoneModal from '../../components/projects/NewMilestoneModal';
import NewProjectModal from '../../components/projects/NewProjectModal';

import { getProjectById, updateProject, deleteProject } from '../../services/projectService';
import { updateTask, deleteTask, createComment } from '../../services/taskService';
import { updateMilestone, deleteMilestone } from '../../services/milestoneService';
import { uploadDocument, deleteDocument } from '../../services/documentService';
import { uploadDeliverable, deleteDeliverable, updateDeliverable } from '../../services/deliverableService';
import { getActivities } from '../../services/deliverableService';

import { 
  FileText, FolderOpen, Calendar, Circle, ArrowUpRight, 
  CheckCircle2, ListTodo, Plus, Trash2, ShieldCheck, Flag, Download, Eye, X,
  Link as LinkIcon, ExternalLink
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// Displays project dashboards, task board, timeline milestones and files directories
function ProjectDetail({ projectId: propProjectId, onBack }) {
  const { id: routeProjectId } = useParams();
  const id = propProjectId || routeProjectId;
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detects window screen resize parameters to toggle sidebar visibility states
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { user, token } = useSelector((state) => state.auth);
  const isClient = user?.role === 'CLIENT';
  const isStaff = user?.role === 'STAFF';
  const isAdmin = user?.role === 'ADMIN';

  // Document Modal & Form States
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("FILE"); // "FILE" or "LINK"
  const [formFile, setFormFile] = useState(null);
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedViewDoc, setSelectedViewDoc] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(null);
  
  // Modal open states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Selected task in drawer
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Upload progress states
  const [isUploading, setIsUploading] = useState(false);

  // Deletion confirmation states
  const [showProjectDeleteConfirm, setShowProjectDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Fetch project details
  const fetchProjectDetails = useCallback(() => {
    getProjectById(id)
      .then((res) => {
        const p = res.data.data;
        // Format properties to align with view expectations
        const colors = ['#6366F1', '#059669', '#D97706', '#DC2626', '#0284C7', '#7C3AED'];
        
        // Count tasks
        const totalTasks = p.tasks?.length || 0;
        const tasksDone = p.tasks?.filter(t => t.status === 'Completed' || t.status === 'Done').length || 0;
        
        // Count milestones
        const totalMilestones = p.milestones?.length || 0;
        const milestonesDone = p.milestones?.filter(m => m.status === 'Completed').length || 0;

        const formatted = {
          id: p.id,
          name: p.name,
          description: p.description,
          client: p.client ? p.client.company : "Independent",
          budget: p.budget && !isNaN(Number(p.budget)) ? Number(p.budget).toLocaleString('en-IN') : (p.budget ? String(p.budget) : '0'),
          progress: p.progress,
          status: p.status,
          startDate: p.startDate ? new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "N/A",
          dueDate: p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "N/A",
          rawClientId: p.clientId,
          rawStartDate: p.startDate ? p.startDate.split('T')[0] : '',
          rawDueDate: p.dueDate ? p.dueDate.split('T')[0] : '',
          rawStatus: p.status,
          rawProgress: p.progress,
          rawTeamIds: (p.team || []).map(m => m.id),
          deliverables: p.deliverables || [],
          team: (p.team || []).map((m, idx) => ({
            id: m.id,
            name: m.fullName,
            role: m.role || 'Contributor',
            color: colors[idx % colors.length],
            avatar: m.avatar || null
          })),
          tasks: (p.tasks || []).map((t) => ({
            id: t.id,
            taskKey: t.taskKey,
            title: t.title,
            description: t.description,
            priority: t.priority,
            status: t.status,
            dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "No Due Date",
            assignee: {
              id: t.assignee?.id,
              name: t.assignee?.fullName || "Unassigned",
              avatarColor: t.assignee?.role === 'CLIENT' ? '#0284C7' : '#059669',
              initials: t.assignee?.fullName ? t.assignee.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "??",
              avatar: t.assignee?.avatar || null
            },
            attachments: (t.attachments || []).map(att => ({ name: att.name, size: att.size })),
            comments: (t.comments || []).map(c => ({
              id: c.id,
              text: c.text,
              user: c.user?.fullName || "System User",
              date: new Date(c.createdAt).toLocaleDateString()
            }))
          })),
          milestones: p.milestones || [],
          documents: (p.documents || []).map(doc => {
            let ext = "FILE";
            if (doc.type === "LINK") {
              ext = "LINK";
            } else if (doc.fileUrl) {
              const parts = doc.fileUrl.split(".");
              ext = parts[parts.length - 1].toUpperCase();
            }
            return {
              id: doc.id,
              name: doc.title || "Untitled Document",
              size: doc.type === "LINK" ? "External Link" : "File",
              ext: ext,
              url: doc.type === "LINK" 
                ? doc.linkUrl 
                : `${import.meta.env.VITE_API_URL || ""}/api/documents/download/${doc.id}?token=${token}`,
              uploader: doc.uploadedBy?.fullName || "Unknown",
              date: new Date(doc.createdAt).toLocaleDateString(),
              description: doc.description || "",
              type: doc.type,
              fileUrl: doc.fileUrl || "",
              linkUrl: doc.linkUrl || "",
              clientName: p.client ? `${p.client.fullName} (${p.client.company || 'N/A'})` : "Independent",
              staffMembers: p.team && p.team.length > 0 ? p.team.map(t => t.fullName).join(", ") : "None"
            };
          }),
          deliverableItems: p.deliverableItems || [],
          activities: (p.activities || []).map(act => ({
            id: act.id,
            title: act.title,
            description: act.description,
            type: act.type,
            time: new Date(act.createdAt).toLocaleString()
          })),
          tasksDone,
          totalTasks,
          milestonesDone,
          totalMilestones,
          recentActivity: (p.activities || []).slice(0, 3).map(act => ({
            id: act.id,
            title: act.title,
            description: act.description,
            type: act.type,
            time: new Date(act.createdAt).toLocaleDateString()
          }))
        };

        setProject(formatted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading project detail:", err);
        setLoading(false);
      });
  }, [id]);

  // Preloads full details catalog mapped to active project key
  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  // Find currently open task in drawer
  const selectedTask = project?.tasks?.find(t => t.id === selectedTaskId) || null;

  // Open Modal for Create Document
  const handleOpenDocModal = () => {
    setFormTitle("");
    setFormDescription("");
    setFormType("FILE");
    setFormFile(null);
    setFormLinkUrl("");
    setFormError("");
    setIsDocModalOpen(true);
  };

  // Document Upload/Link Create Modal Save
  const handleSaveDocument = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim()) {
      setFormError("Title is required");
      return;
    }
    if (formType === "FILE" && !formFile) {
      setFormError("Please select a file to upload");
      return;
    }
    if (formType === "FILE" && formFile && formFile.size > 30 * 1024 * 1024) {
      setFormError("File size limit exceeded. Maximum allowed size is 30 MB.");
      return;
    }
    if (formType === "LINK" && !formLinkUrl.trim()) {
      setFormError("Please enter an external link URL");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", formTitle.trim());
      formData.append("description", formDescription.trim());
      formData.append("type", formType);
      formData.append("projectId", id);

      if (formType === "FILE") {
        formData.append("file", formFile);
      } else {
        formData.append("linkUrl", formLinkUrl.trim());
      }

      await uploadDocument(formData);
      showToast("Document uploaded successfully!", "success");
      setIsDocModalOpen(false);
      fetchProjectDetails();
    } catch (err) {
      console.error("Error saving document:", err);
      setFormError(err.response?.data?.message || "Failed to upload document");
    } finally {
      setSaving(false);
    }
  };

  // Deliverable Upload
  const handleDeliverableUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      showToast("File size limit exceeded. Maximum allowed size is 30 MB.", "error");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", id);
    formData.append("stage", "Production Phase");

    uploadDeliverable(formData)
      .then(() => {
        fetchProjectDetails();
        setIsUploading(false);
      })
      .catch((err) => {
        console.error("Error uploading deliverable:", err);
        setIsUploading(false);
      });
  };

  // Delete Document Confirmation
  const confirmDeleteDoc = async () => {
    if (!deletingDoc) return;
    try {
      await deleteDocument(deletingDoc.id);
      showToast("Document deleted successfully!", "success");
      setDeletingDoc(null);
      fetchProjectDetails();
    } catch (err) {
      console.error("Error deleting doc:", err);
      showToast("Failed to delete document: " + (err.response?.data?.message || err.message), "error");
    }
  };

  // Delete Deliverable
  const handleDeleteDeliverable = (delId) => {
    if (!window.confirm("Are you sure you want to delete this deliverable?")) return;
    deleteDeliverable(delId)
      .then(() => fetchProjectDetails())
      .catch(err => console.error("Error deleting deliverable:", err));
  };

  const handleUpdateDeliverableStatus = (delId, newStatus) => {
    updateDeliverable(delId, { status: newStatus })
      .then(() => fetchProjectDetails())
      .catch((err) => console.error("Error updating deliverable status:", err));
  };

  // Milestone updates
  const handleToggleMilestone = (msId, currentStatus, currentProgress) => {
    const newStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
    const newProgress = newStatus === 'Completed' ? 100 : 50;

    updateMilestone(msId, { status: newStatus, progress: newProgress })
      .then(() => fetchProjectDetails())
      .catch(err => console.error("Error toggling milestone:", err));
  };

  const handleDeleteMilestone = (msId) => {
    if (!window.confirm("Are you sure you want to delete this milestone?")) return;
    deleteMilestone(msId)
      .then(() => fetchProjectDetails())
      .catch(err => console.error("Error deleting milestone:", err));
  };

  // Task inline updates
  const handleTaskStatusChange = (taskId, currentStatus) => {
    const nextStatusMap = {
      'To Do': 'In Progress',
      'In Progress': 'In Review',
      'In Review': 'Completed',
      'Completed': 'To Do'
    };
    const nextStatus = nextStatusMap[currentStatus] || 'To Do';

    updateTask(taskId, { status: nextStatus })
      .then(() => fetchProjectDetails())
      .catch(err => console.error("Error updating task status:", err));
  };

  const handleTaskPriorityChange = (taskId, currentPriority) => {
    const nextPriorityMap = {
      'Low': 'Medium',
      'Medium': 'High',
      'High': 'Critical',
      'Critical': 'Low'
    };
    const nextPriority = nextPriorityMap[currentPriority] || 'Medium';

    updateTask(taskId, { priority: nextPriority })
      .then(() => fetchProjectDetails())
      .catch(err => console.error("Error updating task priority:", err));
  };

  // Comment Creation
  const handleAddComment = (taskId, text) => {
    createComment(taskId, { text })
      .then(() => {
        fetchProjectDetails();
      })
      .catch(err => console.error("Error sending comment:", err));
  };

  // Project updates
  const handleUpdateProject = (updatedProj) => {
    updateProject(id, updatedProj)
      .then(() => {
        fetchProjectDetails();
      })
      .catch((err) => {
        console.error("Error updating project:", err);
      });
  };

  // Delete project
  const handleDeleteProject = () => {
    setShowProjectDeleteConfirm(true);
  };

  // Calls delete API wrapper to remove project catalog elements
  const confirmDeleteProject = () => {
    deleteProject(id)
      .then(() => {
        showToast("Project deleted successfully");
        setShowProjectDeleteConfirm(false);
        if (onBack) {
          onBack();
        } else {
          navigate('/admin/projects');
        }
      })
      .catch((err) => {
        console.error("Error deleting project:", err);
        showToast("Failed to delete project", "error");
        setShowProjectDeleteConfirm(false);
      });
  };

  // Delete task
  const handleDeleteTask = (taskId) => {
    const taskObj = project.tasks.find(t => t.id === taskId);
    setTaskToDelete(taskObj || { id: taskId, title: "Task" });
  };

  // Prompts verification dialog and removes active selected task
  const confirmDeleteTask = () => {
    if (!taskToDelete) return;
    deleteTask(taskToDelete.id)
      .then(() => {
        showToast("Task deleted successfully");
        fetchProjectDetails();
        setSelectedTaskId(null); // Close panel if open
        setTaskToDelete(null);
      })
      .catch((err) => {
        console.error("Error deleting task:", err);
        showToast("Failed to delete task", "error");
        setTaskToDelete(null);
      });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans text-slate-500">
        <svg className="animate-spin h-8 w-8 text-[#4F46E5] mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-semibold">Loading project details...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-slate-500">
        Project not found.
      </div>
    );
  }

  const handleRemoveTeamMember = async (memberId) => {
    try {
      const updatedTeamIds = (project.rawTeamIds || []).filter(memberIdItem => memberIdItem !== memberId);
      await updateProject(id, { teamIds: updatedTeamIds });
      showToast("Team member removed from project", "success");
      fetchProjectDetails();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove team member", "error");
    }
  };

  // Dictates custom view panels rendering for milestones, kanbans, and deliverables
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ProjectOverview 
            project={project} 
            onAddTeamMemberClick={() => setIsEditModalOpen(true)} 
            onRemoveTeamMember={handleRemoveTeamMember}
            isAdmin={isAdmin}
          />
        );
      case 'tasks':
        return (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden font-sans">
            <div className="p-5 border-b border-[#F1F5F9] flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[#F8FAFC]/30">
              <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <ListTodo size={16} className="text-[#4F46E5]" />
                Project Tasks
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {project.tasks.length} Total
                </span>
                {!isClient && !isStaff && (
                  <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4F46E5] text-xs font-bold text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer shadow-xs"
                  >
                    <Plus size={14} /> Add Task
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto overflow-y-hidden">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
                    <th scope="col" className="text-left py-3 px-5 text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-wider">Task Title</th>
                    <th scope="col" className="text-left py-3 px-4 text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-wider hidden sm:table-cell">Assignee</th>
                    <th scope="col" className="text-left py-3 px-4 text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-wider hidden sm:table-cell">Due Date</th>
                    <th scope="col" className="text-left py-3 px-4 text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-wider hidden md:table-cell">Priority (Toggle)</th>
                    <th scope="col" className="text-left py-3 px-4 text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-wider">Status (Toggle)</th>
                    <th scope="col" className="text-right py-3 px-5 text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {project.tasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="border-b border-[#F8FAFC] last:border-0 hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-5 text-sm font-semibold text-[#0F172A] hover:text-[#4F46E5] transition-colors">
                        {task.title}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-[#475569] hidden sm:table-cell">{task.assignee.name}</td>
                      <td className="py-3.5 px-4 text-xs text-[#475569] font-medium hidden sm:table-cell">{task.dueDate}</td>
                      <td className="py-3.5 px-4 hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                        {isClient ? (
                          <StatusBadge status={task.priority} />
                        ) : (
                          <button onClick={() => handleTaskPriorityChange(task.id, task.priority)}>
                             <StatusBadge status={task.priority} />
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        {isClient ? (
                          <StatusBadge status={task.status} />
                        ) : (
                          <button onClick={() => handleTaskStatusChange(task.id, task.status)}>
                            <StatusBadge status={task.status} />
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        {!isClient && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0 bg-transparent border-none"
                            title="Delete Task"
                           aria-label="Delete Task">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {project.tasks.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-xs text-slate-400 italic">No tasks created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'milestones':
        return (
          <div className="mt-6 space-y-4 font-sans">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-500">
                Milestones progress updates Project Progress dynamically.
              </span>
              {!isClient && !isStaff && (
                <button
                  onClick={() => setIsMilestoneModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#4F46E5] text-xs font-bold text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer shadow-sm"
                >
                  <Plus size={15} /> Add Milestone
                </button>
              )}
            </div>
            
            {project.milestones.map((ms) => (
              <div key={ms.id} className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <button 
                    onClick={() => !isClient && handleToggleMilestone(ms.id, ms.status, ms.progress)}
                    disabled={isClient}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isClient ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      ms.status === 'Completed' 
                        ? 'bg-emerald-50 text-emerald-600 ' + (!isClient ? 'hover:bg-emerald-100' : '') 
                        : 'bg-slate-50 text-slate-400 ' + (!isClient ? 'hover:bg-slate-100' : '')
                    }`}
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A] font-display">{ms.title}</h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5 flex items-center gap-1.5 font-medium">
                      <Calendar size={12} /> Target Date: {ms.date ? new Date(ms.date).toLocaleDateString() : 'No Target Date'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-28 bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#4F46E5] h-full transition-all" style={{ width: `${ms.progress}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-8 text-right">{ms.progress}%</span>
                  <StatusBadge status={ms.status} />
                  
                  {!isClient && !isStaff && (
                    <button 
                      onClick={() => handleDeleteMilestone(ms.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {project.milestones.length === 0 && (
              <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
                <Flag size={40} className="text-slate-350 mx-auto mb-2" />
                <p className="text-xs text-slate-400 italic">No milestones defined yet.</p>
              </div>
            )}
          </div>
        );
      case 'documents':
        return (
          <div className="mt-6 font-sans space-y-4">
            {!isClient && (
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 border border-[#E2E8F0] rounded-xl shadow-xs">
                <span className="text-xs font-semibold text-slate-500">Upload files & version guidelines locally.</span>
                <button
                  onClick={handleOpenDocModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#4F46E5] text-xs font-bold text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer shadow-sm border-none"
                >
                  <Plus size={15} /> Upload File
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {project.documents.map((doc) => (
                <div key={doc.id} className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm hover:border-[#CBD5E1] transition-all flex flex-col justify-between group">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${
                      doc.ext === 'PDF' ? 'bg-rose-50 text-rose-600' : doc.ext === 'ZIP' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {doc.ext}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewFile({ name: doc.name, url: doc.url, ext: doc.ext }); }}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer bg-transparent border-none"
                        title="Preview File"
                       aria-label="Preview File">
                        <Eye size={13} />
                      </button>
                      {doc.type === "FILE" ? (
                        <a
                          href={doc.url}
                          download={doc.name}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                          title="Download"
                        >
                          <Download size={13} />
                        </a>
                      ) : (
                        <a
                          href={doc.url}
                          target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                          title="Open Link"
                        >
                          <ArrowUpRight size={13} />
                        </a>
                      )}
                      {!isClient && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeletingDoc(doc); }}
                          className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer bg-transparent border-none"
                          title="Delete"
                         aria-label="Delete">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div 
                    className="mt-4 cursor-pointer"
                    onClick={() => setSelectedViewDoc(doc)}
                  >
                    <h4 className="text-xs font-bold text-[#0F172A] line-clamp-1 group-hover:text-[#4F46E5] transition-colors">{doc.name}</h4>
                    <p className="text-[11px] text-[#94A3B8] mt-1 font-semibold">{doc.size} • By {doc.uploader}</p>
                    <p className="text-[9px] text-[#CBD5E1] mt-0.5">{doc.date}</p>
                  </div>
                </div>
              ))}
              {project.documents.length === 0 && (
                <div className="col-span-4 text-center py-16 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
                  <FolderOpen size={40} className="text-slate-350 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 italic">No documents uploaded.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'deliverables':
        return (
          <div className="mt-6 font-sans space-y-4">
            {!isClient && (
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 border border-[#E2E8F0] rounded-xl shadow-xs">
                <span className="text-xs font-semibold text-slate-500 flex flex-col">
                  <span>Submit files for client review, sign off, approval, or rejection.</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Max allowed file size: 30 MB</span>
                </span>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#4F46E5] text-xs font-bold text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer shadow-sm">
                  <Plus size={15} /> Submit Deliverable
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleDeliverableUpload} 
                    disabled={isUploading}
                  />
                </label>
              </div>
            )}

            {isUploading && (
              <div className="text-center py-4 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-xs font-semibold text-slate-505">Uploading deliverable package...</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {project.deliverableItems.map((item) => {
                const isPending = !item.status || item.status === "Awaiting Review" || item.status.toLowerCase().includes("awaiting") || item.status.toLowerCase().includes("pending");
                const fileExt = item.name.includes('.') ? item.name.substring(item.name.lastIndexOf('.') + 1).toUpperCase() : 'FILE';
                return (
                  <div key={item.id} className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div 
                      className="space-y-1 cursor-pointer flex-1"
                      onClick={() => setPreviewFile({ name: item.name, url: item.url, ext: fileExt })}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md ${
                          item.status === 'Approved' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : item.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold">{item.stage}</span>
                      </div>
                      <h4 className="font-display font-bold text-slate-900 text-sm hover:text-[#4F46E5] transition-colors">{item.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Submitted Size: {item.size}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => setPreviewFile({ name: item.name, url: item.url, ext: fileExt })}
                        className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Preview"
                       aria-label="Preview">
                        <Eye size={13} />
                        Preview
                      </button>
                      <a 
                        href={item.url} 
                        download={item.name}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
                        title="Download"
                      >
                        <Download size={15} />
                      </a>
                      {isClient && isPending && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateDeliverableStatus(item.id, "Rejected"); }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-750 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-rose-200"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateDeliverableStatus(item.id, "Approved"); }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs transition-colors"
                          >
                            Approve
                          </button>
                        </>
                      )}
                      {!isClient && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteDeliverable(item.id); }}
                          className="p-1.5 rounded text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Delete"
                         aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {project.deliverableItems.length === 0 && (
                <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
                  <ShieldCheck size={40} className="text-slate-350 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 italic">No deliverables submitted for review yet.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'activity':
        return (
          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0] font-sans">
            <h3 className="text-base font-bold text-[#0F172A] font-display mb-5 uppercase tracking-wider">Unified Activity Feed</h3>
            <div className="space-y-6 relative before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-[2px] before:bg-slate-100">
              {project.activities.map((act) => (
                <div key={act.id} className="flex items-start gap-4 relative">
                  <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center z-10 font-bold text-xs shadow-sm ${
                    act.type === 'upload' ? 'bg-indigo-50 text-[#4F46E5]' : act.type === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-505'
                  }`}>
                    {act.type === 'upload' ? '↑' : act.type === 'completed' ? '✓' : '⚑'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{act.title}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5 font-medium">{act.time} &bull; {act.description}</p>
                  </div>
                </div>
              ))}
              {project.activities.length === 0 && (
                <p className="text-xs text-slate-400 italic py-4">No recent activity logged for this project.</p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-0 -m-6 min-h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <ProjectHeader 
          project={project} 
          onEditClick={() => setIsEditModalOpen(true)}
          onAddTaskClick={() => setIsTaskModalOpen(true)}
          onDeleteClick={handleDeleteProject}
          onBackClick={onBack}
          userRole={user?.role}
        />
        <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {renderTabContent()}
      </div>

      {/* Task Detail Sidebar */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onAddComment={handleAddComment}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {/* Task Creation Modal */}
      <NewProjectTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        projectId={id}
        projectName={project.name}
        team={project.team}
        onSave={fetchProjectDetails}
      />

      {/* Milestone Creation Modal */}
      <NewMilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        projectId={id}
        onSave={fetchProjectDetails}
      />

      {/* Edit Project Modal */}
      <NewProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        projectToEdit={project}
        onSave={handleUpdateProject}
      />

      {/* New Document Overlay Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Add New Document
              </h3>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-655 p-1 cursor-pointer hover:bg-slate-50 bg-transparent border-none rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveDocument} className="p-6 space-y-4 text-left">
              
              {formError && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs font-semibold text-rose-700">
                  {formError}
                </div>
              )}

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Project Requirements Spec"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all"
                  required
                 aria-label="e.g. Project Requirements Spec"/>
              </div>

              {/* Project select dropdown (Disabled/Locked) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Assign to Project</label>
                <select
                  value={id}
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#64748B] cursor-not-allowed outline-none"
                  required
                 aria-label="Select w-full h-10 px-3 rounded-lg border border-[# e2 e8 f0] bg-[# f8 f a f c] text-sm text-[#64748 b] cursor-not-allowed outline-none">
                  <option value={id}>{project.name}</option>
                </select>
              </div>

              {/* Type radios */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Upload Type</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="formType"
                      value="FILE"
                      checked={formType === "FILE"}
                      onChange={() => setFormType("FILE")}
                      className="w-4 h-4 text-[#4F46E5] focus:ring-[#4F46E5]"
                     aria-label="Form Type"/>
                    Upload Local File
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="formType"
                      value="LINK"
                      checked={formType === "LINK"}
                      onChange={() => setFormType("LINK")}
                      className="w-4 h-4 text-[#4F46E5] focus:ring-[#4F46E5]"
                     aria-label="Form Type"/>
                    External URL Link
                  </label>
                </div>
              </div>

              {/* Conditionally show File input or Link input */}
              {formType === "FILE" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">File Attachment</label>
                  <div className="border border-dashed border-[#CBD5E1] hover:border-[#4F46E5] rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50/50 transition-colors relative">
                    <svg className="w-7 h-7 text-[#94A3B8] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-600">
                      {formFile ? formFile.name : "Click to select a file"}
                    </span>
                    {!formFile && (
                      <span className="text-[10px] text-slate-400 mt-1">Max allowed size: 30 MB</span>
                    )}
                    <input
                      type="file"
                      onChange={(e) => setFormFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">External URL Link</label>
                  <input
                    type="url"
                    placeholder="e.g. https://figma.com/..."
                    value={formLinkUrl}
                    onChange={(e) => setFormLinkUrl(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all"
                    required={formType === "LINK"}
                   aria-label="e.g. https://figma.com/..."/>
                </div>
              )}

              {/* Description field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  placeholder="e.g. Initial requirements document for review..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows="3"
                  className="w-full p-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all resize-none"
                 aria-label="e.g. Initial requirements document for review..."/>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 h-10 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer bg-white"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 h-10 rounded-lg bg-[#4F46E5] hover:bg-[#3730A3] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm border-none"
                  disabled={saving}
                >
                  {saving && (
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  Create Document
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Document Details Modal */}
      {selectedViewDoc && (
        <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-up p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                {selectedViewDoc.type === "FILE" ? <FileText size={18} className="text-rose-500" /> : <LinkIcon size={18} className="text-blue-500" />}
                Document Details
              </h3>
              <button
                onClick={() => setSelectedViewDoc(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-655 hover:bg-slate-50 transition-colors cursor-pointer bg-transparent border-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Details list */}
            <div className="space-y-3.5 text-left max-h-[55vh] overflow-y-auto pr-1">
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Document Name</span>
                <span className="text-sm font-semibold text-slate-800">{selectedViewDoc.name}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Project</span>
                  <span className="block text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md mt-1 w-max">{project.name}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Client</span>
                  <span className="block text-xs font-semibold text-slate-700 mt-1">{selectedViewDoc.clientName || "Independent"}</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Team (Staff)</span>
                <span className="block text-xs font-medium text-slate-700 mt-1 leading-normal">{selectedViewDoc.staffMembers || "None"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border mt-1 ${
                    selectedViewDoc.type === "FILE" 
                      ? "bg-rose-50 text-rose-700 border-rose-100" 
                      : "bg-blue-50 text-blue-700 border-blue-100"
                  }`}>
                    {selectedViewDoc.type}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date Added</span>
                  <span className="text-xs font-medium text-slate-600 block mt-1">{selectedViewDoc.date}</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Uploaded By</span>
                <span className="text-xs font-semibold text-slate-755 block mt-1">{selectedViewDoc.uploader}</span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Description</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed mt-1.5 whitespace-pre-wrap">
                  {selectedViewDoc.description || "No description provided."}
                </p>
              </div>
            </div>

            {/* Action footer */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
              <button
                onClick={() => setSelectedViewDoc(null)}
                className="px-4.5 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer bg-white"
              >
                Close
              </button>
              {selectedViewDoc.type === "FILE" ? (
                <a
                  href={selectedViewDoc.url}
                  download={selectedViewDoc.name}
                  onClick={(e) => e.stopPropagation()}
                  className="px-4.5 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm decoration-none"
                >
                  <Download size={13} />
                  Download File
                </a>
              ) : (
                <a
                  href={selectedViewDoc.url}
                  target="_blank" rel="noopener noreferrer"
                  className="px-4.5 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm decoration-none"
                >
                  <ExternalLink size={13} />
                  Open Link
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      {deletingDoc && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display text-left">Confirm Deletion</h3>
            <p className="text-xs text-slate-500 leading-normal text-left">
              Are you sure you want to permanently delete document <strong>{deletingDoc.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingDoc(null)}
                className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDoc}
                className="px-4 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer border-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document/Deliverable Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 shrink-0 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={18} className="text-[#4F46E5] shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 font-display truncate">
                  {previewFile.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer animate-fade-in"
                >
                  <Download size={14} />
                  Download
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 flex items-center justify-center min-h-[40vh] sm:min-h-[50vh]">
              {['PDF', 'TXT', 'PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG'].includes(previewFile.ext) ? (
                ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG'].includes(previewFile.ext) ? (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-w-full max-h-[50vh] sm:max-h-[60vh] object-contain rounded-lg shadow-sm"
                  />
                ) : isMobile ? (
                  <div className="text-center py-6 px-4 bg-white border border-slate-200 rounded-xl max-w-sm w-full shadow-sm flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mb-4 font-bold text-lg border border-indigo-100/50">
                      {previewFile.ext}
                    </div>
                    <p className="text-sm font-bold text-slate-800">Document Reader</p>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      To view this {previewFile.ext} on a mobile device, please open it in a new tab or download the file.
                    </p>
                    <div className="flex flex-col gap-2 mt-5 w-full">
                      <a
                        href={previewFile.url}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#3730A3] text-xs font-bold text-white shadow-sm transition-all"
                      >
                        <ExternalLink size={14} />
                        Open in New Tab
                      </a>
                      <a
                        href={previewFile.url}
                        download={previewFile.name}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all bg-white"
                      >
                        <Download size={14} />
                        Download File
                      </a>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={previewFile.url}
                    title={previewFile.name}
                    className="w-full h-[60vh] border-0 rounded-lg bg-white shadow-sm"
                  />
                )
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                    {previewFile.ext}
                  </div>
                  <p className="text-sm font-bold text-slate-800">Preview not available</p>
                  <p className="text-xs text-slate-500 mt-1">This file type ({previewFile.ext}) cannot be previewed inline.</p>
                  <a
                    href={previewFile.url}
                    download={previewFile.name}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-[#4F46E5] text-xs font-bold text-white hover:bg-[#3730A3] transition-all cursor-pointer shadow-sm"
                  >
                    <Download size={14} />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Project Delete Confirmation Modal */}
      {showProjectDeleteConfirm && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display text-left">Confirm Project Deletion</h3>
            <p className="text-xs text-slate-500 leading-normal text-left">
              Are you sure you want to permanently delete project <strong>{project.name}</strong>? All associated tasks, milestones, deliverables, and documents will also be permanently deleted. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowProjectDeleteConfirm(false)}
                className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                className="px-4 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer border-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display text-left">Confirm Task Deletion</h3>
            <p className="text-xs text-slate-500 leading-normal text-left">
              Are you sure you want to permanently delete task <strong>{taskToDelete.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTask}
                className="px-4 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer border-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetail;
