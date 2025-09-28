import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useEffect, useRef } from "react";            // <-- for focus management
import { cldUrl } from "../libs/cdn";

/**
 * Modal: previews a selected image pair and lets users download both at once.
 * - Preview uses Cloudinary (900w, c_fit to avoid 400s with gravity).
 * - Download bundles both images into a single ZIP via JSZip + FileSaver.
 *
 * A11y & UX:
 * - Modal images use loading="eager" (they're in-view).
 * - We restore focus to the opener on close to avoid the aria-hidden warning.
 * - Keep Bootstrap JS loaded globally so data-bs-* works.
 */
function Modal(props) {
  const { selectedImages } = props;

  // Selected pair from the grid (usually 2 images)
  const set = selectedImages?.imageSet ?? [];
  const title = selectedImages?.title ?? "";

  // ---- Focus management to prevent: "Blocked aria-hidden..." warning ----
  const modalRef = useRef(null);
  const lastActiveRef = useRef(null);

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    const onShow = () => {
      // Remember which element opened the modal (thumb, etc.)
      lastActiveRef.current = document.activeElement;
    };

    const onHidden = () => {
      // If something inside the modal still has focus, blur it
      if (el.contains(document.activeElement)) {
        (document.activeElement instanceof HTMLElement) && document.activeElement.blur();
      }
      // Restore focus to the opener for good a11y
      if (lastActiveRef.current instanceof HTMLElement) {
        lastActiveRef.current.focus();
      }
    };

    el.addEventListener("show.bs.modal", onShow);
    el.addEventListener("hidden.bs.modal", onHidden);
    return () => {
      el.removeEventListener("show.bs.modal", onShow);
      el.removeEventListener("hidden.bs.modal", onHidden);
    };
  }, []);
  // ----------------------------------------------------------------------

  /**
   * Build a viewing URL for the modal.
   * Use c_fit (no gravity) to avoid Cloudinary 400 errors.
   */
  const getViewSrc = (img) =>
    img.publicId ? cldUrl(img.publicId, { w: 900, fit: "fit" }) : img.url;

  /**
   * Build a "raw" URL for fetching blobs to ZIP.
   * Keep it simple: no fl_attachment, no extra transforms unless you want to force a format.
   * If you want universal compatibility, you could pass { fmt: "jpg", q: "auto" } here.
   */
  const getRawHref = (img) => (img.publicId ? cldUrl(img.publicId) : img.url);

  // Map common MIME types to a file extension (fallback to jpg if unknown)
  const mimeToExt = {
    "image/avif": "avif",
    "image/webp": "webp",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
  };

  /**
   * Download handler:
   * - Fetch each image as a Blob (CORS ok with Cloudinary).
   * - Name files predictably (title-based), add them into a folder in the ZIP.
   * - Save one ZIP to the user’s device (1 user gesture => no pop-up issues).
   */
  const handleDownload = async () => {
    if (!set.length) return;

    try {
      const zip = new JSZip();

      // Sanitize a readable folder/base name from the pair title
      const base = (title || "matchmade-pair")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const folder = zip.folder(base) || zip;

      // Fetch all images as blobs (in parallel)
      const blobs = await Promise.all(
        set.map(async (img, idx) => {
          const url = getRawHref(img);
          const res = await fetch(url, { mode: "cors" });
          if (!res.ok) throw new Error(`Failed to fetch image #${idx + 1}: ${res.status}`);

          const blob = await res.blob();

          // Prefer MIME-derived extension over URL suffix (more reliable with f_auto)
          const extFromMime = mimeToExt[blob.type];
          const extFromUrl = (url.split(".").pop() || "").split("?")[0].toLowerCase();
          const ext = extFromMime || extFromUrl || "jpg";

          // Descriptive file name inside the ZIP
          const name = `${base || "image"}_${idx + 1}.${ext}`;
          return { name, blob };
        })
      );

      // Add each blob into the folder
      blobs.forEach(({ name, blob }) => folder.file(name, blob));

      // Generate and save the ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${base}.zip`);
    } catch (err) {
      console.error("ZIP download failed:", err);

      // Fallback: attempt separate tab downloads (may be limited by the browser)
      set.forEach((img, idx) => {
        const a = document.createElement("a");
        a.href = img.publicId
          ? cldUrl(img.publicId, { attach: `matchmade_image_${idx + 1}` })
          : img.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.click();
      });
    }
  };

  return (
    <div
      className="modal fade"
      id="imagePreview"
      tabIndex="-1"
      aria-labelledby="modalTitle"
      aria-hidden="true"
      role="dialog"
      aria-modal="true"
      ref={modalRef}                              // <-- enable show/hidden listeners
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <h2 className="modal-title fs-3" id="modalTitle">{title}</h2>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"/>
          </div>

          {/* Body: larger previews */}
          <div className="modal-body">
            <div className="container">
              <div className="row">
                {set.map((img, index) => {
                  const key = (img.publicId || img.url || "img") + index;
                  const src = getViewSrc(img);
                  return (
                    <div className="col-6 d-flex justify-content-center" key={key}>
                      <img
                        src={src}
                        alt={img.alt || ""}
                        className="img-fluid m-1"
                        loading="eager"            // Modal: load now
                        decoding="async"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer: one-click ZIP download.
              Tip: remove data-bs-dismiss if you want the modal to stay open during the save dialog. */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={(e) => {                         // proactively blur to avoid aria-hidden focus warning
                (document.activeElement instanceof HTMLElement) && document.activeElement.blur();
                handleDownload();
              }}
              data-bs-dismiss="modal"
              disabled={!set.length}
            >
              Download Image Pair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal;
