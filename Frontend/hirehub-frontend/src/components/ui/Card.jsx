/**
 * Card — elevated content container.
 *
 * Props:
 *   padding  – 'none' | 'sm' | 'md' | 'lg'
 *   hover    – adds lift-on-hover effect
 */
export default function Card({
  children,
  padding = 'md',
  hover = false,
  className = '',
  ...props
}) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-xl border border-slate-200 shadow-card
        ${hover ? 'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200' : ''}
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
