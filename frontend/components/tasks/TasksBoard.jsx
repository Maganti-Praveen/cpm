// Renders task card columns categorized by task statuses.
// Updates task stages.


import { Calendar, AlertCircle } from 'lucide-react';
import Avatar from '../common/Avatar';
import StatusBadge from '../common/StatusBadge';

const COLUMNS = [
  { status: 'To Do', label: 'To Do', border: 'border-slate-200', dot: 'bg-slate-400' },
  { status: 'In Progress', label: 'In Progress', border: 'border-blue-200', dot: 'bg-blue-500' },
  { status: 'In Review', label: 'In Review', border: 'border-purple-200', dot: 'bg-purple-500' },
  { status: 'Completed', label: 'Completed', border: 'border-emerald-200', dot: 'bg-emerald-500' }
];

function TasksBoard({ tasks = [], onSelectTask, onUpdateTaskStatus }) {
  // Map tasks list
  const groupedTasks = COLUMNS.reduce((acc, col) => {
    acc[col.status] = tasks.filter((t) => t.status === col.status || (col.status === 'Completed' && t.status === 'Done'));
    return acc;
  }, {});

  const checkOverdue = (dateStr) => {
    try {
      const today = new Date();
      const taskDate = new Date(dateStr);
      today.setHours(0, 0, 0, 0);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate < today;
    } catch {
      return false;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
      {COLUMNS.map((col) => {
        const list = groupedTasks[col.status] || [];
        return (
          <div key={col.status} className="flex flex-col min-h-[500px]">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                <span className="text-sm font-bold text-slate-800 font-display">
                  {col.label}
                </span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                {list.length}
              </span>
            </div>

            {/* List Cards */}
            <div
              className="flex-1 space-y-3"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData("text/plain");
                if (onUpdateTaskStatus && taskId) {
                  onUpdateTaskStatus(taskId, col.status);
                }
              }}
            >
              {list.map((task) => {
                const isOverdue = checkOverdue(task.dueDate) && task.status !== 'Completed';
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", task.id.toString());
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => onSelectTask && onSelectTask(task)}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-150 cursor-pointer active:scale-[0.99] group"
                  >
                    {/* Project & Key */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: task.projectColor || '#4F46E5' }}
                        />
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {task.project}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">
                        #{task.taskKey}
                      </span>
                    </div>

                    {/* Task Title */}
                    <h4 className="text-xs font-bold text-slate-800 font-display leading-snug group-hover:text-primary transition-colors mb-4 line-clamp-2">
                      {task.title}
                    </h4>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={task.assignee.name}
                          size="xs"
                          color={task.assignee.avatarColor}
                          src={task.assignee.avatar}
                        />
                        <span className="text-[11px] font-semibold text-slate-600">
                          {task.assignee.name}
                        </span>
                      </div>
                      
                      <div className={`flex items-center gap-1 text-[11px] ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-400 font-medium'}`}>
                        {isOverdue ? <AlertCircle size={11} /> : <Calendar size={11} />}
                        <span>{task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {list.length === 0 && (
                <div className="flex items-center justify-center h-20 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-[11px] text-slate-400 font-medium">No tasks in stage</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TasksBoard;
