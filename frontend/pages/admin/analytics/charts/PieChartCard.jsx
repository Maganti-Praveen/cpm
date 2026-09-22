// Houses pie charts mapping project counts to client categories.
// Applies styling colors based on active themes.


import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// custom tooltip component for donut chart
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const { name, value } = entry;
  const amount = entry.payload?.amount;

  const formatAmount = (amt) => {
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(1)}L`;
    if (amt >= 1000) return `₹${(amt / 1000).toFixed(1)}K`;
    return `₹${amt}`;
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-[#334155]">{name}</p>
      <p className="text-sm font-bold text-[#0F172A]">Count: {value}</p>
      {amount != null && amount > 0 && (
        <p className="text-sm font-bold text-[#4F46E5]">{formatAmount(amount)}</p>
      )}
    </div>
  );
};

// reusable donut/pie chart card component
function PieChartCard({ title, data = [], height = 280 }) {
  // empty state fallback
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-[0.9375rem] font-semibold text-[#0F172A] font-display">
          {title}
        </h3>
        <div
          className="flex items-center justify-center"
          style={{ height }}
        >
          <p className="text-sm text-[#94A3B8]">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-[0.9375rem] font-semibold text-[#0F172A] font-display mb-2">
        {title}
      </h3>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 inline-block"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-[#64748B] font-medium">
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PieChartCard;
