import microscopyManager from '../tools/microscopyManager';

export default function getSourceDisplaySet(studies, microscopySRDisplaySet) {
  const referencedDisplaySet = _getReferencedDisplaySet(
    microscopySRDisplaySet,
    studies
  );

  microscopyManager.clearAnnotations();

  microscopySRDisplaySet.load(referencedDisplaySet, studies);

  return referencedDisplaySet;
}

const _getReferencedDisplaySet = (microscopySRDisplaySet, studies) => {
  let allDisplaySets = [];

  const { ReferencedFrameOfReferenceUID } = microscopySRDisplaySet;

  studies.forEach(study => {
    allDisplaySets = allDisplaySets.concat(study.displaySets);
  });

  const otherDisplaySets = allDisplaySets.filter(
    ds =>
      ds.displaySetInstanceUID !== microscopySRDisplaySet.displaySetInstanceUID
  );

  const referencedDisplaySet = otherDisplaySets.find(
    displaySet =>
      displaySet.Modality === 'SM' &&
      displaySet.FrameOfReferenceUID === ReferencedFrameOfReferenceUID
  );

  return referencedDisplaySet;
};
