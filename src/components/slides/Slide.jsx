import TextSlide from './TextSlide';
import ImageSlide from './ImageSlide';
import YouTubeSlide from './YouTubeSlide';
import IframeSlide from './IframeSlide';
import MDXSlide from './MDXSlide';

/**
 * Shared slide renderer used by both the presenter view (App.jsx) and the
 * audience/stage view (AudienceView.jsx). Handles every slide `type` produced
 * by the deck loaders, including the external-deck case where a `text` slide
 * carries a pre-rendered HTML string instead of a {title, body} object.
 */
export default function Slide({ slide }) {
  if (!slide) return null;

  switch (slide.type) {
    case 'text':
      // External decks serialize MDX to an HTML string; bundled decks pass a
      // {title, body} object that TextSlide knows how to render.
      if (typeof slide.html === 'string') {
        return (
          <div
            className="max-w-5xl mx-auto px-8"
            style={{ color: 'var(--text-main)' }}
            dangerouslySetInnerHTML={{ __html: slide.html }}
          />
        );
      }
      return <TextSlide html={slide.html} />;
    case 'image':
      return <ImageSlide src={slide.src} alt={slide.alt} />;
    case 'youtube':
      return <YouTubeSlide youtubeId={slide.youtubeId} start={slide.start} />;
    case 'iframe':
      return <IframeSlide src={slide.src} />;
    case 'mdx':
      return <MDXSlide Component={slide.Component} layout={slide.layout} />;
    case 'error':
      return (
        <div className="text-red-500 max-w-2xl mx-auto p-8">
          <h2 className="text-3xl font-bold mb-4">Error Loading Slide</h2>
          <p>{slide.error}</p>
        </div>
      );
    default:
      return <div className="text-red-500 text-center">Unknown slide type: {slide.type}</div>;
  }
}
