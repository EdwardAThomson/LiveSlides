export default function TextSlide({ html }) {
  return (
    <div className="max-w-5xl mx-auto text-center px-8">
      {html.title && (
        <h1 
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight"
          dangerouslySetInnerHTML={{ __html: html.title }}
        />
      )}
      {html.body && (
        <div 
          className="text-2xl md:text-3xl leading-relaxed opacity-90"
          dangerouslySetInnerHTML={{ __html: html.body }}
        />
      )}
    </div>
  );
}
