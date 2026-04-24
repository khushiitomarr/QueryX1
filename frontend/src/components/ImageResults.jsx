export default function ImageResults({ images, setSelectedImage }) {
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
      {images.map((img, i) => (
        <div key={i} className="break-inside-avoid">
          <img
           loading="lazy" src={img.thumbnail}
            alt=""
            onClick={() => setSelectedImage(img)}
            className="rounded-lg w-full cursor-pointer hover:scale-105 transition duration-300"
          />
        </div>
      ))}
    </div>
  );
}