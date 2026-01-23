export default function Callout({ type = 'info', children }) {
  const types = {
    info: {
      bg: 'var(--bg-info)',
      text: 'var(--text-info)',
      border: 'var(--border-info)',
    },
    warning: {
      bg: 'var(--bg-warning)',
      text: 'var(--text-warning)',
      border: 'var(--border-warning)',
    },
    success: {
      bg: 'var(--bg-success)',
      text: 'var(--text-success)',
      border: 'var(--border-success)',
    },
    error: {
      bg: 'var(--bg-error)',
      text: 'var(--text-error)',
      border: 'var(--border-error)',
    },
  };

  const style = types[type] || types.info;

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
    error: '❌',
  };

  return (
    <div
      className="border-l-4 p-4 rounded transition-colors duration-300"
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        color: style.text
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icons[type]}</span>
        <div className="flex-1 font-medium">{children}</div>
      </div>
    </div>
  );
}
