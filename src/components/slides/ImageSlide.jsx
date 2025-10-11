export default function ImageSlide({ src, alt = "slide image" }) {
  return (
    <div className="flex items-center justify-center w-full h-full p-8">
      <img 
        src={src} 
        alt={alt}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
      />
    </div>
  );
}
