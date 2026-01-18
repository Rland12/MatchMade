import { useEffect, useRef, useState } from "react";
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

  // Overlay presets (vibe buttons)
  const OVERLAY_PRESETS = [
    { name: "Vamp Plum", color: "#2b0a3d", opacity: 45, blend: "multiply" },
    { name: "Poet Sepia", color: "#7a5a3a", opacity: 85, blend: "color" },
    { name: "Gummy Neon", color: "#2bff88", opacity: 75, blend: "soft-light" },
    { name: "Glitch Cyan", color: "#00e5ff", opacity: 45, blend: "difference" },
    { name: "Romance Rose", color: "#ff3b7a", opacity: 67, blend: "overlay" },
  ];

  const resetOverlay = () => {
    setOverlayColor("#9D41EF");
    setOverlayOpacityPct(25);
    setOverlayBlendMode("multiply");
    setOverlayApplyTo("both");
  };

  // ===== Overlay state =====
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [overlayColor, setOverlayColor] = useState("#9D41EF"); // default: your brand purple
  const [overlayOpacityPct, setOverlayOpacityPct] = useState(25); // 0..100
  const [overlayBlendMode, setOverlayBlendMode] = useState("multiply");
  const [overlayApplyTo, setOverlayApplyTo] = useState("both"); // both | left | right

  const overlayOpacity = Math.min(Math.max(overlayOpacityPct, 0), 100) / 100;

  // Simple mobile detection for UI (not security critical)
  const isMobile =
    typeof navigator !== "undefined" &&
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");

  // Derive folder from the current URL: /pair/:slug  => home,  /pair/:folder/:slug => folder
  const getFolderFromPath = () => {
    const path = location?.pathname || "/";
    const parts = path.replace(/^\/+|\/+$/g, "").split("/");
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
        document.activeElement.blur();
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
      sentViewRef.current = false;

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
        const onShown = () => {
          if (!sentViewRef.current) {
            analytics.viewItem({
              folder,
              slug: slugify(title || ""),
              title: title || "",
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
    img.publicId ? cldUrl(img.publicId, { w: 780, fit: "fit" }) : img.url;

  // limit download size but keep good quality
  const getRawHref = (img) =>
    img.publicId
      ? cldUrl(img.publicId, { w: 1024, fit: "fit", q: "auto" })
      : img.url;

  const whichSide = (img, index) => {
    const a = (img?.alt || "").toLowerCase();
    const pid = String(img?.publicId || "").toLowerCase();
    if (a.includes("— left") || a.includes(" - left") || a.endsWith(" left")) return "left";
    if (a.includes("— right") || a.includes(" - right") || a.endsWith(" right")) return "right";
    if (pid.includes("left")) return "left";
    if (pid.includes("right")) return "right";
    return index === 0 ? "left" : "right";
  };

  const shouldApplyOverlayToSide = (side) => {
    if (!overlayEnabled) return false;
    if (overlayApplyTo === "both") return true;
    return overlayApplyTo === side;
  };

  // ===== Canvas bake helper (NEW) =====
  const applyOverlayToBlob = async (inputBlob, { color, opacity, blendMode }) => {
    // Prefer createImageBitmap for speed + avoids CORS-taint issues since we're working from a Blob.
    let bitmap = null;
    try {
      if (typeof createImageBitmap === "function") {
        bitmap = await createImageBitmap(inputBlob);
      }
    } catch {
      bitmap = null;
    }

    // Fallback: Image() from blob URL
    const loadImageFromBlob = (blob) =>
      new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: true });

    if (bitmap) {
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      ctx.drawImage(bitmap, 0, 0);

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blendMode;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // free bitmap memory if supported
      if (typeof bitmap.close === "function") bitmap.close();
    } else {
      const img = await loadImageFromBlob(inputBlob);
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      ctx.drawImage(img, 0, 0);

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blendMode;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    const outBlob = await new Promise((res) => canvas.toBlob(res, "image/png", 1.0));
    if (!outBlob) throw new Error("Could not export image");
    return outBlob;
  };

  const mimeToExt = {
    "image/avif": "avif",
    "image/webp": "webp",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
  };

  const handleDownloadSide = async (side) => {
    if (!set.length) return;

    const index = side === "right" ? 1 : 0;
    const img = set[index];
    if (!img) return;

    const baseName = (title || "matchmade-pair")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const url = getRawHref(img);

    let saveAs;
    try {
      ({ saveAs } = await import("file-saver"));
    } catch (err) {
      console.error("file-saver failed to load:", err);
      alert("Download is unavailable right now. Please try again.");
      return;
    }

    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error(`fetch image: ${res.status}`);

      const blob = await res.blob();

      const useOverlay = shouldApplyOverlayToSide(side);
      if (useOverlay) {
        const out = await applyOverlayToBlob(blob, {
          color: overlayColor,
          opacity: overlayOpacity,
          blendMode: overlayBlendMode,
        });
        const filename = `${baseName}-${side}-overlay.png`;
        saveAs(out, filename);
        return;
      }

      // original behavior (preserve format)
      const ext = mimeToExt[blob.type] || "jpg";
      const filename = `${baseName}-${side}.${ext}`;
      saveAs(blob, filename);
    } catch (err) {
      console.error("Side download failed:", err);
      alert("Could not download this image. Please try again.");
    }
  };

  const handleDownload = async () => {
    if (!set.length) return;

    // Track the click(s) before starting heavy work
    try {
      set.forEach((img, i) => {
        const side = whichSide(img, i);
        const url = getRawHref(img);
        analytics.downloadPfp({
          folder,
          slug: slugify(title || ""),
          title: title || "",
          side,
          format: (url.split("?")[0].split(".").pop() || "jpg").toLowerCase(),
          url,
          overlay_enabled: overlayEnabled,
          overlay_blend: overlayBlendMode,
          overlay_opacity: overlayOpacityPct,
        });
      });
      analytics.send?.("download_pfp_pair", {
        item_id: slugify(title || ""),
        item_name: title || "",
        item_category: folder || "home",
        count: set.length,
        overlay_enabled: overlayEnabled,
      });
    } catch {
      // no-op
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
          const side = whichSide(img, i);
          const url = getRawHref(img);
          const res = await fetch(url, { mode: "cors" });
          if (!res.ok) throw new Error(`fetch ${i + 1}: ${res.status}`);

          const blob = await res.blob();

          const useOverlay = shouldApplyOverlayToSide(side);
          if (useOverlay) {
            const out = await applyOverlayToBlob(blob, {
              color: overlayColor,
              opacity: overlayOpacity,
              blendMode: overlayBlendMode,
            });
            folderZip.file(`${base}_${i + 1}_overlay.png`, out);
            return;
          }

          const ext = mimeToExt[blob.type] || "jpg";
          folderZip.file(`${base}_${i + 1}.${ext}`, blob);
        })
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${base}.zip`);
    } catch (err) {
      console.error("ZIP download failed:", err);
      alert("Download failed. Opening each image instead.");
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

  // ===== Preview overlay styles (NEW) =====
  const overlayLayerStyle = {
    position: "absolute",
    inset: 0,
    background: overlayColor,
    opacity: overlayOpacity,
    mixBlendMode: overlayBlendMode,
    pointerEvents: "none",
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
                  const side = whichSide(img, index);
                  const showOverlay = shouldApplyOverlayToSide(side);

                  return (
                    <div className="col-6 d-flex justify-content-center" key={key}>
                      <div className="modal-avatar-wrap" style={{ position: "relative", overflow: "hidden" }}>
                        <img
                          src={src}
                          alt={img.alt || ""}
                          className="modal-avatar-img"
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding="async"
                        />
                        {showOverlay && <div style={overlayLayerStyle} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Overlay controls */}
              <div className="mt-3">
                <div className="d-flex align-items-center justify-content-between mm-overlay-toolbar">
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className={`mm-iconbtn btn ${overlayEnabled ? "is-on" : ""}`}
                      onClick={() => setOverlayEnabled((v) => !v)}
                      aria-pressed={overlayEnabled}
                      aria-controls="mmOverlayPanel"
                      aria-expanded={overlayEnabled}
                      title={overlayEnabled ? "Close overlay editor" : "Open overlay editor"}
                    >
                      {/* Pencil icon (inline SVG, no dependency) */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="mm-iconbtn-text">Overlay</span>
                    </button>

                    <span className="small mm-overlay-state">
                      {overlayEnabled ? "On" : "Off"}
                    </span>
                  </div>


                  <button
                    type="button"
                    className="mm-iconbtn btn btn-sm mm-overlay-reset"
                    onClick={resetOverlay}
                    disabled={!overlayEnabled}
                  >
                    Reset
                  </button>
                </div>

                {overlayEnabled && (
                  <div className="mt-2 p-2 border rounded-3 mm-overlay-panel" id="mmOverlayPanel">

                    {/* Preset swatches */}
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h3 className="small fw-semibold">Presets</h3>
                      <div
                        className="badge mm-overlay-badge"
                        style={{ fontWeight: 600 }}
                        title={`Color ${overlayColor} | ${overlayOpacityPct}% | ${overlayBlendMode}`}
                      >
                        {overlayOpacityPct}% | {overlayBlendMode}
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {OVERLAY_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          className="mm-swatch"
                          title={p.name}
                          aria-label={`Preset: ${p.name}`}
                          onClick={() => {
                            setOverlayColor(p.color);
                            setOverlayOpacityPct(p.opacity);
                            setOverlayBlendMode(p.blend);
                          }}
                          style={{ background: p.color }}
                        />
                      ))}
                    </div>

                    {/* Color + opacity */}
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <label className="small fw-semibold mb-0" htmlFor="mmOverlayColor">
                          Color
                        </label>
                        <input
                          id="mmOverlayColor"
                          type="color"
                          className="form-control form-control-color mm-color"
                          value={overlayColor}
                          onChange={(e) => setOverlayColor(e.target.value)}
                          aria-label="Overlay color"
                        />
                      </div>

                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between">
                          <label className="small fw-semibold mb-0" htmlFor="mmOverlayOpacity">
                            Opacity
                          </label>
                          <span className="small mm-overlay-state">{overlayOpacityPct}%</span>
                        </div>
                        <input
                          id="mmOverlayOpacity"
                          type="range"
                          className="form-range mt-1"
                          min="0"
                          max="100"
                          value={overlayOpacityPct}
                          onChange={(e) => setOverlayOpacityPct(parseInt(e.target.value || "0", 10))}
                        />
                      </div>
                    </div>

                    {/* Apply to + Blend mode */}
                    <div className="d-flex align-items-center gap-2">
                      <div className="btn-group" role="group" aria-label="Apply overlay to">
                        {[
                          { v: "both", label: "Both" },
                          { v: "left", label: "Left" },
                          { v: "right", label: "Right" },
                        ].map((opt) => (
                          <button
                            key={opt.v}
                            type="button"
                            className={`btn btn-sm mm-overlay-choice ${overlayApplyTo === opt.v ? "active" : ""}`}
                            onClick={() => setOverlayApplyTo(opt.v)}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <div className="ms-auto d-flex align-items-center gap-2">
                        <label className="small fw-semibold mb-0" htmlFor="mmOverlayBlend">
                          Blend
                        </label>
                        <select
                          id="mmOverlayBlend"
                          className="form-select form-select-sm mm-overlay-select"
                          value={overlayBlendMode}
                          onChange={(e) => setOverlayBlendMode(e.target.value)}
                        >
                          <option value="multiply">Multiply</option>
                          <option value="soft-light">Soft Light</option>
                          <option value="overlay">Overlay</option>
                          <option value="screen">Screen</option>
                          <option value="color">Color</option>
                          <option value="difference">Difference</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            {isMobile ? (
              <>
                <div className="d-flex gap-2 w-100">
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-fill"
                    onClick={() => handleDownloadSide("left")}
                    disabled={!set[0]}
                  >
                    Save Left Image
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-fill"
                    onClick={() => handleDownloadSide("right")}
                    disabled={!set[1]}
                  >
                    Save Right Image
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                  handleDownload();
                }}
                data-bs-dismiss="modal"
                disabled={!set.length}
              >
                Download Image Pair (ZIP)
              </button>
            )}
          </div>

        </div>
      </div>
    </div >
  );
}

export default Modal;
