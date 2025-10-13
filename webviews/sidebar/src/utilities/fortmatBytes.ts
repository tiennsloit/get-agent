export function formatBytes(bytes: number): string {
  if (bytes < 0) {
    throw new Error("Bytes cannot be negative");
  }

  const MB = 1024 * 1024;
  const GB = 1024 * MB;

  if (bytes >= GB) {
    return `${(bytes / GB).toFixed(2)} Gb`;
  } else if (bytes >= MB) {
    return `${(bytes / MB).toFixed(2)} Mb`;
  } else {
    return `${bytes} bytes`;
  }
}
