// Renders profile images or fallback initials with custom styling.
// Formats rings and colors based on size variables.


const colorPalette = [
  '#6366F1', '#059669', '#D97706', '#DC2626', '#0284C7',
  '#7C3AED', '#DB2777', '#EA580C', '#0D9488', '#4F46E5',
];

// Computes a deterministic background badge color using the user's name hash
function generateColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPalette[Math.abs(hash) % colorPalette.length];
}

const sizeMap = {
  xs: { dim: '1.5rem', font: '0.5rem' },
  sm: { dim: '2rem', font: '0.6875rem' },
  md: { dim: '2.5rem', font: '0.875rem' },
  lg: { dim: '4rem', font: '1.25rem' },
};

function Avatar({ name = '', size = 'sm', color, src, className = '' }) {
  const { dim, font } = sizeMap[size] || sizeMap.sm;
  // Extracts initials from the profile name for non-image fallbacks
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const bgColor = color || generateColor(name);

  const pixelMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 64,
  };
  const sizePx = pixelMap[size] || 32;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={sizePx}
        height={sizePx}
        loading="lazy"
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: dim, height: dim }}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 ${className}`}
      style={{ width: dim, height: dim, fontSize: font, backgroundColor: bgColor }}
      title={name}
    >
      {initials}
    </div>
  );
}

function AvatarStack({ users = [], max = 4, size = 'sm' }) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;
  const { dim } = sizeMap[size] || sizeMap.sm;

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <div
          key={user.id || i}
          className="rounded-full border-2 border-white"
          style={{ marginLeft: i > 0 ? '-0.5rem' : 0, zIndex: max - i }}
        >
          <Avatar name={user.name} size={size} color={user.color} src={user.src} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="inline-flex items-center justify-center rounded-full font-medium border-2 border-white bg-[#F1F5F9] text-[#64748B]"
          style={{
            width: dim,
            height: dim,
            fontSize: '0.6875rem',
            marginLeft: '-0.5rem',
            zIndex: 0,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

export { Avatar, AvatarStack };
export default Avatar;
