export default function VideoResults({ videos, setSelectedVideo }) {
  return (
    <div className="video-results-list">
      {videos.map((v, i) => {
        if (!v.link) return null;

        return (
          <div
            key={i}
            className="video-result-card"
            onClick={() => setSelectedVideo(v)}
          >
            {/* THUMBNAIL */}
            <img
              src={v.thumbnail}
              onError={(e) => {
                const id = v.link?.includes("v=")
                  ? v.link.split("v=")[1]?.split("&")[0]
                  : v.link?.split("youtu.be/")[1];

                e.target.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
              }}
              className="video-result-thumb"
            />

            {/* TEXT */}
            <div className="video-result-body">
              <h3 className="video-result-title">
                {v.title}
              </h3>

              <p className="video-result-channel">
                {v.channel}
              </p>

              {/* Optional description if available */}
              {v.description && (
                <p className="video-result-description">
                  {v.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
