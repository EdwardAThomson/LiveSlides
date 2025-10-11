export default function Iframe({ 
  src, 
  height = '70vh',
  title = 'Embedded content',
  sandbox = 'allow-scripts allow-same-origin allow-forms'
}) {
  return (
    <div className="w-full rounded-lg overflow-hidden shadow-lg bg-white">
      <iframe 
        src={src}
        title={title}
        sandbox={sandbox}
        className="w-full border-0"
        style={{ height }}
      />
    </div>
  );
}
