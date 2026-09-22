// Drawer showing comments, attachments, checklist items, and assignees for a task.
// Directs task operations.


import { useState } from 'react';
import { X, User, CalendarDays, Circle, AlertTriangle, Paperclip, FileText, MessageSquare, Send, Trash2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import StatusBadge from '../common/StatusBadge';

function TaskDetailPanel({ task, onClose, onAddComment, onDeleteTask }) {
  const [commentText, setCommentText] = useState('');

  if (!task) return null;

  // Intercepts input actions to validate comment forms and invoke callback
  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !onAddComment) return;
    onAddComment(task.id, commentText.trim());
    setCommentText('');
  };

  return (
    <div className="w-80 bg-white border-l border-[#E2E8F0] h-full shrink-0 flex flex-col font-sans">
      {/* Header */}
      <div className="p-5 border-b border-[#F1F5F9] shrink-0">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-bold text-[#0F172A] font-display pr-4 leading-snug">
            {task.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {onDeleteTask && (
              <button
                onClick={() => onDeleteTask(task.id)}
                className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer shrink-0 border-none bg-transparent"
                title="Delete Task"
               aria-label="Delete Task">
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Fields */}
        <div className="space-y-3.5">
          {/* Assignee */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              <User size={13} className="text-[#94A3B8]" />
              Assignee
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] font-display">
              <Avatar name={task.assignee.name} size="xs" color={task.assignee.avatarColor || task.assignee.color} src={task.assignee.avatar} />
              {task.assignee.name}
            </span>
          </div>

          {/* Due Date */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              <CalendarDays size={13} className="text-[#94A3B8]" />
              Due Date
            </span>
            <span className="text-xs font-bold text-[#0F172A] font-display">{task.dueDate}</span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              <Circle size={13} className="text-[#94A3B8]" />
              Status
            </span>
            <StatusBadge status={task.status.toUpperCase()} />
          </div>

          {/* Priority */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              <AlertTriangle size={13} className="text-[#94A3B8]" />
              Priority
            </span>
            <StatusBadge status={task.priority.toUpperCase()} />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Description */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-2 uppercase tracking-wider">
            <FileText size={13} className="text-[#64748B]" />
            Description
          </h4>
          <p className="text-xs text-[#475569] leading-relaxed bg-[#F8FAFC] border border-slate-100 rounded-lg p-3">
            {task.description || "No description provided."}
          </p>
        </div>

        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="pt-1">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-3 uppercase tracking-wider">
              <Paperclip size={13} className="text-[#64748B]" />
              Attachments
            </h4>
            <div className="space-y-2">
              {task.attachments.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 bg-[#F8FAFC] border border-slate-100 rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#FEE2E2] flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-[#DC2626]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0F172A] truncate font-display">{file.name}</p>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">{file.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr className="border-slate-100" />

        {/* Comments List */}
        <div className="pt-1">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-3 uppercase tracking-wider">
            <MessageSquare size={13} className="text-[#64748B]" />
            Comments ({task.comments?.length || 0})
          </h4>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {task.comments?.map((comment) => (
              <div key={comment.id} className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 shadow-xs">
                <div className="flex items-center justify-between mb-1 font-display">
                  <span className="text-[11px] font-bold text-slate-800">{comment.user}</span>
                  <span className="text-[9px] text-slate-400">{comment.date}</span>
                </div>
                <p className="text-xs text-slate-600 leading-normal">{comment.text}</p>
              </div>
            ))}
            {(!task.comments || task.comments.length === 0) && (
              <p className="text-xs text-slate-400 italic">No comments yet. Start the conversation below.</p>
            )}
          </div>
        </div>
      </div>

      {/* Comment Input Footer */}
      <form onSubmit={handleSendComment} className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-3 shrink-0">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full h-10 pl-3.5 pr-10 bg-white border border-[#CBD5E1] rounded-xl text-xs outline-none focus:border-[#4F46E5] focus:ring-3 focus:ring-[#4F46E5]/12 transition-all placeholder:text-slate-450 font-medium text-slate-800"
           aria-label="Write a comment..."/>
          <button 
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#4F46E5] hover:text-indigo-800 transition-colors cursor-pointer bg-transparent border-0"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default TaskDetailPanel;
