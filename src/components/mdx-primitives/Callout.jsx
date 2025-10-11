export default function Callout({ type = 'info', children }) {
  const types = {
    info: 'bg-blue-500/20 border-blue-500 text-blue-100',
    warning: 'bg-yellow-500/20 border-yellow-500 text-yellow-100',
    success: 'bg-green-500/20 border-green-500 text-green-100',
    error: 'bg-red-500/20 border-red-500 text-red-100',
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
    error: '❌',
  };

  return (
    <div className={`border-l-4 p-4 rounded ${types[type] || types.info}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icons[type]}</span>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
