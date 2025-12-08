import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import ModalJs from "bootstrap/js/dist/modal";
import { cldUrl } from "../libs/cdn";
import { analytics } from "@/libs/analytics";
import { slugify } from "@/utils/slug";

function Modal(props) {
  const { selectedImages, onClose } = props;

  const set = selectedImages?.imageSet ?? [];
  const title = selectedImages?.title ?? "";
  const credit = selectedImages?.credit ?? null;

  const modalRef = useRef(null);
  const lastActiveRef = useRef(null);
  const sentViewRef = useRef(false);

  const location = useLocation();

  // Derive folder from the current URL: /pair/:slug  => home,  /pair/:folder/:slug => folder
  const getFolderFromPath = () => {
    const path = location?.pathname || "/";
    // normalize
    const parts = path.replace(/^\/+|\/+$/g, "").split("/");
    // expect ["pair", "<slug>"] or ["pair", "<folder>", "<slug>"]
    if (parts[0] !== "pair") return "home";
    if (parts.length === 2) return "home";
    if (parts.length >= 3) return parts[1] || "home";
    return "home";
  };
  const folder = getFolderFromPath();

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
      // allow a fresh view event next time this opens
      sentViewRef.current = false;
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

  // Open when selectedImages changes + send GA view_item once per open
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
        // Attach a one-time listener for the "shown" event to fire view_item
        const onShown = () => {
          if (!sentViewRef.current) {
            analytics.viewItem({
              folder,
              slug: slugify(title || ""),
              title: title || ""
            });
            sentViewRef.current = true;
          }
          el.removeEventListener("shown.bs.modal", onShown);
        };
        el.addEventListener("shown.bs.modal", onShown);
        instance.show();
      });
    });
  }, [selectedImages, folder, title]);

  const getViewSrc = (img) =>
    img.publicId ? cldUrl(img.publicId, { w: 900, fit: "fit" }) : img.url;

  const getRawHref = (img) => (img.publicId ? cldUrl(img.publicId) : img.url);

  const whichSide = (img, index) => {
    const a = (img?.alt || "").toLowerCase();
    const pid = String(img?.publicId || "").toLowerCase();
    if (a.includes("— left") || a.includes(" - left") || a.endsWith(" left")) return "left";
    if (a.includes("— right") || a.includes(" - right") || a.endsWith(" right")) return "right";
    if (pid.includes("left")) return "left";
    if (pid.includes("right")) return "right";
    // fallback to position
    return index === 0 ? "left" : "right";
  };

  const mimeToExt = {
    "image/avif": "avif",
    "image/webp": "webp",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
  };

  const handleDownload = async () => {
    if (!set.length) return;

    // Track the click(s) before starting heavy work
    try {
      // per-side events
      set.forEach((img, i) => {
        const side = whichSide(img, i);
        const url = getRawHref(img);
        analytics.downloadPfp({
          folder,
          slug: slugify(title || ""),
          title: title || "",
          side,
          format: (url.split("?")[0].split(".").pop() || "jpg").toLowerCase(),
          url
        });
      });
      // summary event
      analytics.send?.("download_pfp_pair", {
        item_id: slugify(title || ""),
        item_name: title || "",
        item_category: folder || "home",
        count: set.length
      });
    } catch {
      // no-op if analytics wrapper isn't loaded
    }

    let JSZip;
    let saveAs;
    try {
      ({ default: JSZip } = await import("jszip"));
      ({ saveAs } = await import("file-saver"));
    } catch (err) {
      console.error("ZIP libraries failed to load:", err);
      alert("Download is unavailable right now. Please try again.");
      return;
    }

    try {
      const zip = new JSZip();
      const base = (title || "matchmade-pair")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const folderZip = zip.folder(base) || zip;

      await Promise.all(
        set.map(async (img, i) => {
          const url = getRawHref(img);
          const res = await fetch(url, { mode: "cors" });
          if (!res.ok) throw new Error(`fetch ${i + 1}: ${res.status}`);
          const blob = await res.blob();
          const ext = mimeToExt[blob.type] || "jpg";
          folderZip.file(`${base}_${i + 1}.${ext}`, blob);
        })
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${base}.zip`);
    } catch (err) {
      console.error("ZIP download failed:", err);
      alert("Download failed. Opening each image instead.");
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
            <div className="credit-container">
              <h2 className="modal-title fs-3" id="modalTitle">{title}</h2>
              {credit && credit.name && (
                <p className="pair-credit">
                  Art by{" "}
                  {credit.url ? (
                    <a href={credit.url} target="_blank" rel="noreferrer">
                      {credit.name}
                    </a>
                  ) : (
                    credit.name
                  )}
                </p>
              )}
            </div>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
          </div>

          <div className="modal-body">
            <div className="container">
              <div className="row gx-1">
                {set.map((img, index) => {
                  const key = (img.publicId || img.url || "img") + index;
                  const src = getViewSrc(img);
                  return (
                    <div className="col-6 d-flex justify-content-center" key={key}>
                      <div className="modal-avatar-wrap">
                        <img
                          src={src}
                          alt={img.alt || ""}
                          className="modal-avatar-img"
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding="async"
                        />
                      </div>
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