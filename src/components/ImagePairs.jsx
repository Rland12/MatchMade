// Displays 3 columns of image "pairs" for a given category.
// Each pair consists of two images (left/right). Uses Cloudinary via cldUrl.
// Includes a lightweight LQIP/skeleton while full images load.

import { imageMap } from "../utils/imageMap";
import { useParams } from "react-router-dom";
import NotFound from "./NotFound";
import { cldUrl } from "../libs/cdn";
import { useState } from "react";

function ImagePairs({ handleClick }) {
  // Read the route param `/category`; default to "/" if missing
  const category = useParams().category || "/";

  // Pull the 3-column structure for this category
  const images = imageMap[category];
  if (!images) return <NotFound />;

  return (
    <div className="container">
      <div className="row">
        {/* 3 columns */}
        {images.map((col, colIndex) => (
          <div className="col-md-4" key={`col-${colIndex}`}>
            {/* Each column contains multiple "pairs" */}
            {col.map((imagePair, pairIndex) => (
              <ImagePair
                images={imagePair}
                handleClick={handleClick} // parent updates selectedImages for the modal
                key={`imagePair-${colIndex}-${pairIndex}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Renders a single pair (two images). Clicking anywhere on the row
 * triggers the parent handler to set the modal's selectedImages.
 *
 * Note:
 *  - Grid thumbs use `c_fill,g_auto` (gravity is fine with fill).
 *  - LQIP: we request a tiny blurred version for a nicer skeleton.
 */
const ImagePair = ({ images, handleClick }) => {
  // Thumb size for grid; adjust once and all thumbs follow
  const dims = { w: 560, h: 560, fit: "fill", g: "auto" };

  return (
    <div className="row" onClick={() => handleClick(images)}>
      {images.imageSet.map((img, index) => {
        // Support both Cloudinary (publicId) and legacy (url) entries
        const isCloud = !!img.publicId;

        // Full-size thumbnail URL (Cloudinary or legacy URL)
        const fullSrc = isCloud ? cldUrl(img.publicId, dims) : img.url;

        // Super-small blurred preview as background for the skeleton
        const tinySrc = isCloud ? cldUrl(img.publicId, { w: 24, q: 10, blur: 2000 }) : null;

        return (
          <MMImage
            key={(img.publicId || img.url) + index}
            src={fullSrc}
            tiny={tinySrc}
            alt={img.alt}
          />
        );
      })}
    </div>
  );
};

/**
 * Small reusable image with:
 *  - reserved aspect ratio space to avoid layout shift,
 *  - shimmer/blur skeleton until the full image loads,
 *  - Bootstrap modal trigger attributes on the <img>.
 *
 * Accessibility:
 *  - role="button" + keyboard handler so Enter/Space opens modal too.
 */
function MMImage({ src, tiny, alt }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="col-6 d-flex justify-content-center">
      <div className="mm-imgwrap m-1">
        {/* Skeleton (optionally uses blurred tiny preview as background) */}
        {!loaded && (
          <div
            className="mm-skel"
            style={
              tiny
                ? { backgroundImage: `url(${tiny})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          />
        )}

        {/* Actual image (fades in via .is-loaded CSS) */}
        <img
          src={src}
          alt={alt}
          className={loaded ? "is-loaded" : ""}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}

          // Bootstrap modal trigger. Make sure <Modal id="imagePreview" /> is mounted once on the page.
          data-bs-toggle="modal"
          data-bs-target="#imagePreview"

          // Keyboard support (Enter/Space to open)
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.currentTarget.click();
            }
          }}
        />
      </div>
    </div>
  );
}

export default ImagePairs;
