import getOrientationVectorsRelativeToAxial from './getOrientationVectorsRelativeToAxial';

export default function getVolumeOrientations(displaySet) {
  const {
    rowCosines,
    columnCosines,
    scanAxisNormal,
  } = getOrientationVectorsRelativeToAxial(displaySet);

  return [
    {
      //Axial
      sliceNormal: [...scanAxisNormal],
      viewUp: [-columnCosines[0], -columnCosines[1], -columnCosines[2]],
    },
    {
      // Sagittal
      sliceNormal: [...rowCosines],
      viewUp: [...scanAxisNormal],
    },
    {
      // Coronal
      sliceNormal: [...columnCosines],
      viewUp: [...scanAxisNormal],
    },
  ];
}
