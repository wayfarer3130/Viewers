import cornerstone from 'cornerstone-core';
import OHIF from '@ohif/core';
import { vec3 } from 'gl-matrix';

const { studyMetadataManager } = OHIF.utils;

export default function getOrientationVectorsRelativeToAxial(
  displaySetMetadata
) {
  const studyMetadata = studyMetadataManager.get(
    displaySetMetadata.StudyInstanceUID
  );
  const allDisplaySets = studyMetadata.getDisplaySets();
  const displaySet = allDisplaySets.find(
    displaySetI =>
      displaySetI.displaySetInstanceUID ===
      displaySetMetadata.displaySetInstanceUID
  );

  const imageId = displaySet.images[0].getImageId();

  const imagePlaneModule = cornerstone.metaData.get(
    'imagePlaneModule',
    imageId
  );

  const { rowCosines, columnCosines } = imagePlaneModule;
  const scanAxisNormal = vec3.cross([], rowCosines, columnCosines);

  const cosines = {
    rowCosines: [],
    columnCosines: [],
    scanAxisNormal: [],
  };

  _setClosestAxialCosine(rowCosines, cosines);
  _setClosestAxialCosine(columnCosines, cosines);
  _setClosestAxialCosine(scanAxisNormal, cosines);

  return cosines;
}

const axialRowCosines = [1, 0, 0];
const axialColumnCosines = [0, 1, 0];
const axialScanAxisNormal = [0, 0, 1];

function _setClosestAxialCosine(directionCosine, cosines) {
  const closest = {
    dot: vec3.dot(directionCosine, axialRowCosines),
    type: 'ROW',
  };

  const directionCosineDotAxialColumn = vec3.dot(
    directionCosine,
    axialColumnCosines
  );

  if (Math.abs(directionCosineDotAxialColumn) > Math.abs(closest.dot)) {
    closest.dot = directionCosineDotAxialColumn;
    closest.type = 'COLUMN';
  }

  const directionCosineDotAxialNormal = vec3.dot(
    directionCosine,
    axialScanAxisNormal
  );
  if (Math.abs(directionCosineDotAxialNormal) > Math.abs(closest.dot)) {
    closest.dot = directionCosineDotAxialNormal;
    closest.type = 'NORMAL';
  }

  switch (closest.type) {
    case 'ROW':
      if (closest.dot > 0) {
        cosines.rowCosines = [...directionCosine];
      } else {
        cosines.rowCosines = [
          -directionCosine[0],
          -directionCosine[1],
          -directionCosine[2],
        ];
      }

      break;
    case 'COLUMN':
      if (closest.dot > 0) {
        cosines.columnCosines = [...directionCosine];
      } else {
        cosines.columnCosines = [
          -directionCosine[0],
          -directionCosine[1],
          -directionCosine[2],
        ];
      }
      break;
    case 'NORMAL':
      if (closest.dot > 0) {
        cosines.scanAxisNormal = [...directionCosine];
      } else {
        cosines.scanAxisNormal = [
          -directionCosine[0],
          -directionCosine[1],
          -directionCosine[2],
        ];
      }
      break;
  }
}
