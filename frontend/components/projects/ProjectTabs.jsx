// Swapper separating overview pages, task kanbans, milestone lists, and documents folders.
// Navigates project files.


const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'documents', label: 'Documents' },
  { key: 'deliverables', label: 'Deliverables' },
  { key: 'activity', label: 'Activity' },
];

function ProjectTabs({ activeTab, onTabChange }) {
  // Renders navigation selector tabs mapping active stages to state actions
  return (
    <div className="border-b border-[#E2E8F0] mt-6 overflow-x-auto no-scrollbar">
      <nav className="flex gap-0 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`relative px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'text-[#4F46E5]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4F46E5] rounded-t-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default ProjectTabs;
