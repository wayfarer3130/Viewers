import { ConfigPoint, SortOp } from 'config-point';

export const { BodyPartLabellingData } = ConfigPoint.register(
  // The original OHIF Labelling Data set
  {
    configName: 'BodyPartLabellingData',
    configBase: {
      items: [
        'Abdomen/Chest Wall',
        'Adrenal',
        'Bladder',
        'Bone',
        'Brain',
        'Breast',
        'Colon',
        'Esophagus',
        'Extremities',
        'Gallbladder',
        'Kidney',
        'Liver',
        'Lung',
        'Lymph Node',
        'Mediastinum/Hilum',
        'Muscle',
        'Neck',
        'Other Soft Tissue',
        'Ovary',
        'Pancreas',
        'Pelvis',
        'Peritoneum/Omentum',
        'Prostate',
        'Retroperitoneum',
        'Small Bowel',
        'Spleen',
        'Stomach',
        'Subcutaneous',
      ],
    },
  },

);
