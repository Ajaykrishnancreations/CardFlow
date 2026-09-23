// Unwarps a quadrilateral region of a source image into a flat rectangular
// output — the same operation document-scanner apps use so a photo taken at
// an angle (or with keystone distortion) turns into a straight, cropped card.
//
// Uses Paul Heckbert's square-to-quad mapping (his 1989 thesis, "Fundamentals
// of Texture Mapping and Image Warping") to build the projective transform,
// then walks every destination pixel, inverse-maps it into the source quad,
// and bilinear-samples the source image. Pure canvas 2D (drawImage only
// supports affine transforms, not perspective), so this has to be per-pixel.

// corners: {tl,tr,br,bl} each {x,y} in SOURCE image pixel space.
// Returns {a,b,c,d,e,f,g,h} such that for normalized (u,v) in [0,1]x[0,1]:
//   x = (a*u + b*v + c) / (g*u + h*v + 1)
//   y = (d*u + e*v + f) / (g*u + h*v + 1)
function squareToQuad(corners) {
  const { tl, tr, br, bl } = corners;
  const x0 = tl.x, y0 = tl.y;
  const x1 = tr.x, y1 = tr.y;
  const x2 = br.x, y2 = br.y;
  const x3 = bl.x, y3 = bl.y;

  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;

  let a, b, c, d, e, f, g, h;
  if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) {
    // Already a parallelogram — pure affine, no perspective term needed.
    a = x1 - x0;
    b = x2 - x1;
    c = x0;
    d = y1 - y0;
    e = y2 - y1;
    f = y0;
    g = 0;
    h = 0;
  } else {
    const denom = dx1 * dy2 - dx2 * dy1;
    g = denom === 0 ? 0 : (dx3 * dy2 - dx2 * dy3) / denom;
    h = denom === 0 ? 0 : (dx1 * dy3 - dy1 * dx3) / denom;
    a = x1 - x0 + g * x1;
    b = x3 - x0 + h * x3;
    c = x0;
    d = y1 - y0 + g * y1;
    e = y3 - y0 + h * y3;
    f = y0;
  }
  return { a, b, c, d, e, f, g, h };
}

function mapUnitSquareToQuad(t, u, v) {
  const denom = t.g * u + t.h * v + 1;
  const x = (t.a * u + t.b * v + t.c) / denom;
  const y = (t.d * u + t.e * v + t.f) / denom;
  return { x, y };
}

function bilinearSample(srcData, srcWidth, srcHeight, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, srcWidth - 1);
  const y1 = Math.min(y0 + 1, srcHeight - 1);
  if (x0 < 0 || y0 < 0 || x0 >= srcWidth || y0 >= srcHeight) return [0, 0, 0, 0];
  const fx = x - x0;
  const fy = y - y0;

  const idx = (xx, yy) => (yy * srcWidth + xx) * 4;
  const i00 = idx(x0, y0);
  const i10 = idx(x1, y0);
  const i01 = idx(x0, y1);
  const i11 = idx(x1, y1);

  const out = [0, 0, 0, 0];
  for (let c = 0; c < 4; c++) {
    const top = srcData[i00 + c] * (1 - fx) + srcData[i10 + c] * fx;
    const bottom = srcData[i01 + c] * (1 - fx) + srcData[i11 + c] * fx;
    out[c] = top * (1 - fy) + bottom * fy;
  }
  return out;
}

/**
 * Unwarps the quadrilateral {tl,tr,br,bl} (source image pixel coordinates)
 * into a flat outputWidth x outputHeight rectangle.
 * imageSource: a data URL, object URL, or any src usable by `new Image()`.
 * Returns a Promise<string> resolving to a JPEG data URL.
 */
export function warpQuadToRect(imageSource, corners, outputWidth, outputHeight) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = img.naturalWidth || img.width;
        srcCanvas.height = img.naturalHeight || img.height;
        const srcCtx = srcCanvas.getContext('2d');
        srcCtx.drawImage(img, 0, 0);
        const srcImageData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
        const srcData = srcImageData.data;

        const outW = Math.max(1, Math.round(outputWidth));
        const outH = Math.max(1, Math.round(outputHeight));
        const dstCanvas = document.createElement('canvas');
        dstCanvas.width = outW;
        dstCanvas.height = outH;
        const dstCtx = dstCanvas.getContext('2d');
        const dstImageData = dstCtx.createImageData(outW, outH);
        const dstData = dstImageData.data;

        const transform = squareToQuad(corners);

        for (let dy = 0; dy < outH; dy++) {
          const v = (dy + 0.5) / outH;
          for (let dx = 0; dx < outW; dx++) {
            const u = (dx + 0.5) / outW;
            const { x: sx, y: sy } = mapUnitSquareToQuad(transform, u, v);
            const [r, g, b, a] = bilinearSample(srcData, srcCanvas.width, srcCanvas.height, sx, sy);
            const di = (dy * outW + dx) * 4;
            dstData[di] = r;
            dstData[di + 1] = g;
            dstData[di + 2] = b;
            dstData[di + 3] = a;
          }
        }

        dstCtx.putImageData(dstImageData, 0, 0);
        resolve(dstCanvas.toDataURL('image/jpeg', 0.95));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Could not load image for perspective correction'));
    img.src = imageSource;
  });
}
