// Card W1-P. Photo Proof: capture with a file input (camera on phones), shrink by canvas re-encode
// (the re-encode drops EXIF and every other metadata block), save in the local photo store, hand the id back.
// mount(panel, { config, kid, day, step, demo, onPhoto(id), onClear() }) per CONTRACTS_v2_ADDENDUM item 11.
// The outbox entry and upload are made by store.append and sync.push from the step.done event (W1-A).

import { h, clear } from "./today.js";
import { newId, putPhoto } from "../store.js";

export const RETRY_MESSAGE = "That photo did not work. Please try once more. Take it a little farther back.";
const MIN_QUALITY = 0.4;
const MAX_TRIES = 8;

/** true when the bytes are a JPEG that carries no EXIF, XMP or other metadata blocks (APP1 to APP15, COM) */
export function isCleanJpeg(bytes) {
  if (!bytes || bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return false;
  let i = 2;
  while (i + 3 < bytes.length) {
    if (bytes[i] !== 0xff) return false;
    const m = bytes[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m === 0xda || m === 0xd9) return true; // image data starts: header segments were all clean
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    if (m === 0xe2 && String.fromCharCode(...bytes.subarray(i + 4, i + 15)) === "ICC_PROFILE") { i += 2 + len; continue; } // browser color profile, not personal data
    if ((m >= 0xe1 && m <= 0xef) || m === 0xfe) return false; // APP1..APP15 (EXIF, XMP, IPTC, MPF...) or comment
    i += 2 + len;
  }
  return false;
}

/** default browser plumbing; tests pass a shim for the same three calls */
const browserEnv = {
  async decode(file) {
    if (globalThis.createImageBitmap) {
      try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch (e) { /* try Image */ }
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally { URL.revokeObjectURL(url); }
  },
  size(src) { return { w: src.naturalWidth || src.width, h: src.naturalHeight || src.height }; },
  render(src, w, h) {
    const c = globalThis.document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
    g.drawImage(src, 0, 0, w, h);
    return c;
  },
  toBlob(canvas, q) {
    return new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", q));
  },
};

/** -> Promise<Blob> JPEG, long side <= config.photo.longSide, under config.photo.maxBytes, no metadata. Throws if it cannot. */
export async function shrink(file, config, env) {
  const e = env || browserEnv;
  const P = config.photo;
  let src;
  try { src = await e.decode(file); } catch (err) { throw new Error("cannot read photo"); }
  const dim = e.size(src);
  if (!(dim.w > 0 && dim.h > 0)) throw new Error("cannot read photo");
  let scale = Math.min(1, P.longSide / Math.max(dim.w, dim.h));
  let q = P.jpegQuality;
  for (let n = 0; n < MAX_TRIES; n++) {
    const w = Math.max(1, Math.floor(dim.w * scale)), h2 = Math.max(1, Math.floor(dim.h * scale));
    const blob = await e.toBlob(e.render(src, w, h2), q);
    if (blob && blob.size <= P.maxBytes) {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (!isCleanJpeg(bytes)) throw new Error("not a clean jpeg");
      if (blob.size <= P.targetBytes || (q <= MIN_QUALITY)) return blob;
      q = Math.max(MIN_QUALITY, q - 0.15); // above the 150 KB goal: try a lower quality, keep the first that fits
      if (n === MAX_TRIES - 1) return blob;
      continue;
    }
    if (q > MIN_QUALITY) q = Math.max(MIN_QUALITY, q - 0.15);
    else scale *= 0.8;
  }
  throw new Error("photo too big");
}

/** mount the photo panel inside a step */
export function mount(root, ctx, env) {
  clear(root);
  const cfg = ctx.config;
  const msg = h("p", { class: "photo-msg muted", role: "status", "data-photo-msg": "" });
  const input = h("input", { type: "file", accept: "image/*", capture: "environment", class: "photo-input", "data-photo-input": "", "aria-label": "Take a photo" });
  const thumb = h("img", { class: "photo-thumb", alt: "Your photo", hidden: true, "data-photo-thumb": "" });
  let busy = false, shown = null;
  const fail = () => { msg.textContent = RETRY_MESSAGE; hide(); ctx.onClear && ctx.onClear(); };
  const hide = () => { thumb.hidden = true; if (shown) { try { URL.revokeObjectURL(shown); } catch (e) { /* ignore */ } shown = null; } };
  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if (!file || busy) return;
    busy = true;
    msg.textContent = "Getting your photo ready";
    ctx.onClear && ctx.onClear();
    try {
      const blob = await shrink(file, cfg, env);
      const id = newId();
      await putPhoto(id, blob);
      hide();
      try { shown = URL.createObjectURL(blob); thumb.src = shown; thumb.hidden = false; } catch (e) { /* preview is optional */ }
      msg.textContent = "Photo saved. Tap again to retake.";
      ctx.onPhoto && ctx.onPhoto(id);
    } catch (err) {
      fail();
    } finally { busy = false; input.value = ""; }
  });
  root.append(
    h("label", { class: "btn-secondary photo-btn" }, "Take photo", input),
    thumb, msg);
}
