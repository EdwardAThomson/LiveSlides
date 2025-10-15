import MediaFrame from '../MediaFrame';

export default function IframeSlide({ src, title = "Embedded app" }) {
  return (
    <div className="flex items-center justify-center w-full h-full p-8">
      <MediaFrame className="w-[95vw] max-w-[1800px] h-[85vh]">
        <iframe 
          className="w-full h-full border-0 bg-white"
          src={src}
          title={title}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </MediaFrame>
    </div>
  );
}
