/**
 * @typedef Point
 * @prop {number} x
 * @prop {number} y
 */
/**
 * Finds the distance between two points
 *
 * @private
 * @function calculateLengthInVoxels
 *
 * @param {Object} data Measurement data
 * @param {Point} data.start Start handle
 * @param {Point} data.end End handle
 * @returns {number} - The calculated distance
 */
export default function({ start, end }) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  return Math.sqrt(dx * dx + dy * dy);
}
