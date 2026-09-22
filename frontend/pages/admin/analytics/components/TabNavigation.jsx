// Tab selector shifting views between billing details and category breakdowns.
// Updates report tabs.

function TabNavigation({ tabs = [], activeTab, onTabChange }) {
  // Configures tab selectors to trigger state transitions when selected
  return (
    <div className="border-b border-[#E2E8F0] mb-6 mt-5">
      <div className="flex gap-1 -mb-px overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`
                px-4 py-2.5 text-sm font-medium transition-colors duration-150
                border-b-2 cursor-pointer bg-transparent outline-none
                ${
                  isActive
                    ? 'text-[#4F46E5] border-[#4F46E5]'
                    : 'text-[#64748B] border-transparent hover:text-[#334155] hover:border-[#CBD5E1]'
                }
              `}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TabNavigation;
