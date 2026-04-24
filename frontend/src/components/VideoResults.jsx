export default function VideoResults({ videos, setSelectedVideo }) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {videos.map((v, i) => {
        if (!v.link) return null;

        return (
          <div
            key={i}
            className="flex gap-4 cursor-pointer hover:bg-gray-800 p-3 rounded-lg transition"
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
              className="w-56 h-32 object-cover rounded-lg"
            />

            {/* TEXT */}
            <div className="flex flex-col justify-between">
              <h3 className="text-base font-semibold text-white line-clamp-2">
                {v.title}
              </h3>

              <p className="text-sm text-gray-400 mt-1">
                {v.channel}
              </p>

              {/* Optional description if available */}
              {v.description && (
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
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