/**
 * Trim leading and trailing slashes.
 *
 * @param {String} path
 */
export function cleanURLSegment (segment) {
  if (segment.startsWith('/')) {
    segment = segment.slice(1)
  }
  if (segment.endsWith('/')) {
    segment = segment.slice(0, -1)
  }
  return segment
}
