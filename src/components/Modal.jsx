import { useEffect, useRef } from "react";
import ModalJs from "bootstrap/js/dist/modal";
import { cldUrl } from "../libs/cdn";

function Modal(props) {
   const { selectedImages, onClose } = props;

  const set = selectedImages?.imageSet ?? [];
  const title = selectedImages?.title ?? "";

  const modalRef = useRef(null);
  const lastActiveRef = useRef(null);

  // Focus management
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    const onHide = () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur(); // blur before aria-hidden toggles
      }
    };

      el.addEventListener("hide.bs.modal", onHide);
      return () => el.removeEventListener("hide.bs.modal", onHide);
  }, []);


  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    const onShow = () => {
      lastActiveRef.current = document.activeElement;
    };

    const onHidden = () => {
      if (el.contains(document.activeElement)) {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      }
      if (lastActiveRef.current instanceof HTMLElement) {
        lastActiveRef.current.focus();
      }
      // ensure state resets so same pair can reopen cleanly
      if (typeof onClose === "function") onClose();
    };

    el.addEventListener("show.bs.modal", onShow);
    el.addEventListener("hidden.bs.modal", onHidden);
    return () => {
      el.removeEventListener("show.bs.modal", onShow);
      el.removeEventListener("hidden.bs.modal", onHidden);
    };
  }, [onClose]);
  

  // Open when selectedImages changes
  useEffect(() => {
    const hasImages =
      selectedImages &&
      Array.isArray(selectedImages.imageSet) &&
      selectedImages.imageSet.length > 0;
    if (!hasImages) return;

    const el = modalRef.current;
    if (!el) return;

    Promise.resolve().then(() => {
      requestAnimationFrame(() => {
        const instance = ModalJs.getOrCreateInstance(el);
        instance.show();
      });
    });
  }, [selectedImages]);

  const getViewSrc = (img) =>
    img.publicId ? cldUrl(img.publicId, { w: 900, fit: "fit" }) : img.url;

  const getRawHref = (img) => (img.publicId ? cldUrl(img.publicId) : img.url);

  const mimeToExt = {
    "image/avif": "avif",
    "image/webp": "webp",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
  };

  const handleDownload = async () => {
  if (!set.length) return;

  try {
    const { default: JSZip } = await import("jszip");
    const { saveAs } = await import("file-saver");

    const zip = new JSZip();
    const base = (title || "matchmade-pair")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const folder = zip.folder(base) || zip;

    const blobs = await Promise.all(
      set.map(async (img, i) => {
        const url = getRawHref(img);
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok) throw new Error(`fetch ${i + 1}: ${res.status}`);
        const blob = await res.blob();
        const ext = mimeToExt[blob.type] || "jpg";
        folder.file(`${base}_${i + 1}.${ext}`, blob);
      })
    );

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${base}.zip`);
  } catch (err) {
    console.error("ZIP download failed:", err);
    // fallback: open each image in a new tab
    set.forEach((img, i) => {
      const a = document.createElement("a");
      a.href = img.publicId
        ? cldUrl(img.publicId, { attach: `matchmade_image_${i + 1}` })
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
      ref={modalRef}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title fs-3" id="modalTitle">{title}</h2>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"/>
          </div>

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
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
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
