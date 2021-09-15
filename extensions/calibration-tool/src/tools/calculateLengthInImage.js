/**
 * @typedef Point
 * @prop {number} x
 * @prop {number} y
 */
/**
 * Finds the distance between two points
 *
 * @private
 * @function calculateLength
 *
 * @param {Object} data Measurement data
 * @param {Point} data.start Start handle
 * @param {Point} data.end End handle
 * @param {number} [colPixelSpacing=1] Image column pixel spacing
 * @param {number} [rowPixelSpacing=1] Image row pixel spacing
 * @returns {number} - The calculated distance
 */
export default function(
  { start, end },
  colPixelSpacing = 1,
  rowPixelSpacing = 1
) {
  const dx = (end.x - start.x) * colPixelSpacing;
  const dy = (end.y - start.y) * rowPixelSpacing;

  return Math.sqrt(dx * dx + dy * dy);
}
