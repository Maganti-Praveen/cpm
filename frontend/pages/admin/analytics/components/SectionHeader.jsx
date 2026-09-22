// Section layout separator displaying titles and filter inputs.
// Organizes visual data categories.


import {
  Briefcase,
  Users,
  UserCheck,
  ListChecks,
  CheckSquare,
  Flag,
  FolderOpen,
  Receipt,
  MessageSquare,
  Headphones,
} from 'lucide-react';

// icon map for sections
const iconMap = {
  Briefcase,
  Users,
  UserCheck,
  ListChecks,
  CheckSquare,
  Flag,
  FolderOpen,
  Receipt,
  MessageSquare,
  Headphones,
};

// section header divider component
function SectionHeader({ title, iconName }) {
  const Icon = iconMap[iconName];

  return (
    <div className="flex items-center gap-2.5 mb-5">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
          <Icon size={16} className="text-[#4F46E5]" />
        </div>
      )}
      <h2 className="text-lg font-semibold text-[#0F172A] font-display">
        {title}
      </h2>
    </div>
  );
}

export default SectionHeader;
