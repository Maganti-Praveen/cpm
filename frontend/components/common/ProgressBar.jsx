// Standard bar component illustrating completion percentages.
// Adjusts colors based on status metrics.


function ProgressBar({ value = 0, showLabel = true, size = 'default' }) {
  const height = size === 'sm' ? '0.25rem' : '0.375rem';
  const fillColor = value === 100 ? 'var(--success-color, #059669)' : 'var(--primary-btn, #4F46E5)';

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height, backgroundColor: "var(--border-color, #E2E8F0)" }}
        role="progressbar"
        aria-valuenow={Math.min(value, 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${Math.min(value, 100)}% complete`}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(value, 100)}%`,
            backgroundColor: fillColor,
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium min-w-[2rem] text-right" style={{ color: "var(--text-tertiary, #64748B)" }}>
          {value}%
        </span>
      )}
    </div>
  );
}

export default ProgressBar;
