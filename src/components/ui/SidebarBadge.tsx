interface SidebarBadgeProps {
  count: number;
  /** compact = dot only (collapsed parent icon) */
  variant?: 'default' | 'compact';
  className?: string;
}

const SidebarBadge = ({ count, variant = 'default', className = '' }: SidebarBadgeProps) => {
  if (!count || count <= 0) return null;

  const label = count > 99 ? '99+' : String(count);

  if (variant === 'compact') {
    return (
      <span
        className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-[#0f1117] shadow-sm ${className}`}
        aria-label={`${label} item menunggu`}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500/90 text-white text-[10px] font-bold rounded-full shadow-sm shrink-0 ${className}`}
      aria-label={`${label} item menunggu`}
    >
      {label}
    </span>
  );
};

export default SidebarBadge;
