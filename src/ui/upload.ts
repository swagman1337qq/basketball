// Custom image uploads (God Mode): center-crop to the target aspect, resize, and
// return a data URL small enough to live in the save file.
export function processImage(file: File, w: number, h: number, type: 'image/png' | 'image/jpeg' = 'image/png'): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return reject(new Error('Use a JPG or PNG image.'));
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const want = w / h, have = img.width / img.height;
      const sw = have > want ? img.height * want : img.width, sh = have > want ? img.height : img.width / want;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d'); if (!ctx) return reject(new Error('Canvas unavailable'));
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL(type, 0.86));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
}
