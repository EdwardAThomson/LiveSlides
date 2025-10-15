/**
 * MediaFrame - A reusable container component that wraps media content
 * with a colorful gradient border and hover effects.
 * 
 * Uses a pseudo-element (::before) to create the gradient border effect
 * without interfering with iframe/video sizing.
 */
export default function MediaFrame({ children, className = "" }) {
  return (
    <div 
      className={`
        relative
        rounded-xl
        overflow-hidden
        ${className}
      `}
      style={{
        padding: '4px', // Border width
        background: 'linear-gradient(135deg, rgb(168, 85, 247), rgb(236, 72, 153), rgb(251, 146, 60))',
      }}
    >
      {/* Inner container with solid background to create border effect */}
      <div className="relative rounded-lg overflow-hidden bg-black w-full h-full">
        {children}
      </div>
    </div>
  );
}
