export default function IframeSlide({ src, title = "Embedded app" }) {
  return (
    <div className="w-[95vw] max-w-[1800px] h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden">
      <iframe 
        className="w-full h-full border-0"
        src={src}
        title={title}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
