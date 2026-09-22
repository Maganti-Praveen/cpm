// Houses bar chart graphics showing invoice metrics over time.
// Re-draws layouts when dates adjust.


import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// tooltip for bar charts
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const value = payload[0].value;
  const dataKey = payload[0].dataKey;
  const isRevenue = dataKey === "revenue" || payload[0].name === "revenue";
  const formattedValue = isRevenue ? `₹${value} Lakhs` : value;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-[#334155]">{label}</p>
      <p className="text-sm font-bold text-[#0F172A]">{formattedValue}</p>
    </div>
  );
};

// reusable bar chart card component
function BarChartCard({
  title,
  data = [],
  dataKey,
  xKey = 'name',
  color = '#4F46E5',
  height = 280,
  badge,
}) {
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
      {/* Header — title + optional badge */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[0.9375rem] font-semibold text-[#0F172A] font-display">
          {title}
        </h3>
        {badge && (
          <span className="text-xs font-medium text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] px-2.5 py-1 rounded-md">
            {badge}
          </span>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barSize={28}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F1F5F9"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            dx={-4}
            tickFormatter={(value) => (dataKey === "revenue" ? `₹${value}L` : value)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BarChartCard;
