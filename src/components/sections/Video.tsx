export function Video() {
  return (
    <div className="w-full max-w-4xl mx-auto my-12 px-4">
      <div className="relative aspect-video rounded-xl border-2 border-black overflow-hidden">
        <video 
          className="w-full h-full object-cover"
          controls
          preload="metadata"
          poster="/thumbnail.png"
        >
          <source src="/mindmentorAI.mp4" type="video/mp4" />
          <track
            src="/captions.vtt"
            kind="subtitles"
            srcLang="en"
            label="English"
          />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}