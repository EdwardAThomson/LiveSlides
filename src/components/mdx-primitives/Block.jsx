export default function Block({ variant = 'default', children }) {
  const variants = {
    default: 'bg-transparent',
    primary: 'bg-blue-500/10 border border-blue-500/30 rounded-lg p-6',
    secondary: 'bg-gray-500/10 border border-gray-500/30 rounded-lg p-6',
    accent: 'bg-purple-500/10 border border-purple-500/30 rounded-lg p-6',
  };

  return (
    <div className={`${variants[variant] || variants.default}`}>
      {children}
    </div>
  );
}
