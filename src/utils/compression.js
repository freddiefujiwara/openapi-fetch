import LZString from "lz-string";

export const decodeMarkdownFromPath = (encoded) => {
  if (!encoded) return "";
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
    return decompressed || decodeURIComponent(encoded);
  } catch (e) {
    return decodeURIComponent(encoded);
  }
};

export const encodeMarkdownToPath = (value) => {
  return value ? LZString.compressToEncodedURIComponent(value) : "";
};
