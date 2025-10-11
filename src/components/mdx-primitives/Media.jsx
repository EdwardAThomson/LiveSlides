export default function Media({ 
  src, 
  alt = '', 
  maxHeight = '60vh',
  className = '' 
}) {
  const isVideo = /\.(mp4|webm|ogg)$/i.test(src);

  if (isVideo) {
    return (
      <video 
        src={src}
        controls
        className={`max-w-full rounded-lg shadow-lg ${className}`}
        style={{ maxHeight }}
      />
    );
  }

  return (
    <img 
      src={src} 
      alt={alt}
      className={`max-w-full object-contain rounded-lg shadow-lg ${className}`}
      style={{ maxHeight }}
    />
  );
}
