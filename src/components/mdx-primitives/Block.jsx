export default function Block({ variant = 'default', children }) {
  const variants = {
    default: { bg: 'transparent', border: 'transparent' },
    primary: { bg: 'var(--bg-block-primary)', border: 'var(--border-block-primary)' },
    secondary: { bg: 'var(--bg-block-secondary)', border: 'var(--border-block-secondary)' },
    accent: { bg: 'var(--bg-block-accent)', border: 'var(--border-block-accent)' },
  };

  const style = variants[variant] || variants.default;

  return (
    <div
      className="rounded-lg p-6 border transition-colors duration-300"
      style={{
        backgroundColor: style.bg,
        borderColor: style.border
      }}
    >
      {children}
    </div>
  );
}
