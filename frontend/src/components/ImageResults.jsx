export default function ImageResults({ images, setSelectedImage }) {
  return (
    <div className="image-results-grid">
      {images.map((img, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setSelectedImage(img)}
          className="image-result-card"
        >
          <img
            loading="lazy"
            src={img.thumbnail}
            alt={img.title || ""}
            className="image-result-thumb"
          />
        </button>
      ))}
    </div>
  );
}
