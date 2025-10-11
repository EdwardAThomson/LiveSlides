export default function YouTubeSlide({ youtubeId, start = 0 }) {
  return (
    <div className="w-[90vw] max-w-[1600px] aspect-video">
      <iframe
        className="w-full h-full rounded-xl shadow-2xl"
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&start=${start}`}
        title="YouTube video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
