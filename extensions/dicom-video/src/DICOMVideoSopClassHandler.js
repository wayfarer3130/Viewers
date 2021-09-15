import OHIF from '@ohif/core';
import requestVideoFile from './requestVideoFile';

const { utils, metadata } = OHIF;
const { OHIFSeriesMetadata } = metadata;

const SOP_CLASS_UIDS = {
  VIDEO_MICROSCOPIC_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.2.1',
  VIDEO_PHOTOGRAPHIC_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.4.1',
  VIDEO_ENDOSCOPIC_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.1.1',
  /** Need to use fallback, could be video or image */
  SECONDARY_CAPTURE_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.7',
  MULTIFRAME_TRUE_COLOR_SECONDARY_CAPTURE_IMAGE_STORAGE:
    '1.2.840.10008.5.1.4.1.1.7.4',
};

const sopClassUIDs = Object.values(SOP_CLASS_UIDS);

const SupportedTransferSyntaxes = {
  MPEG4_AVC_264_HIGH_PROFILE: '1.2.840.10008.1.2.4.102',
  MPEG4_AVC_264_BD_COMPATIBLE_HIGH_PROFILE: '1.2.840.10008.1.2.4.103',
  MPEG4_AVC_264_HIGH_PROFILE_FOR_2D_VIDEO: '1.2.840.10008.1.2.4.104',
  MPEG4_AVC_264_HIGH_PROFILE_FOR_3D_VIDEO: '1.2.840.10008.1.2.4.105',
  MPEG4_AVC_264_STEREO_HIGH_PROFILE: '1.2.840.10008.1.2.4.106',
  HEVC_265_MAIN_PROFILE: '1.2.840.10008.1.2.4.107',
  HEVC_265_MAIN_10_PROFILE: '1.2.840.10008.1.2.4.108',
};

const supportedTransferSyntaxUIDs = Object.values(SupportedTransferSyntaxes);

const DICOMVideoSopClassHandler = {
  id: 'DICOMVideoSopClassHandlerPlugin',
  sopClassUIDs,
  getDisplaySetFromSeries: async function getDisplaySetFromSeries(
    series,
    study,
    dicomWebClient,
    headers,
    addDisplaySet,
    skipGenerationOfRemainingDisplaySets = false
  ) {
    const instance = series.getFirstInstance();

    const { wadouri, metadata: naturalizedDataset } = instance.getData();

    const {
      FrameOfReferenceUID,
      SeriesDescription,
      ContentDate,
      ContentTime,
      SeriesNumber,
      Modality,
      SOPInstanceUID,
    } = naturalizedDataset;

    const generateDisplaySetsForRemainingVideoInstances = async () => {
      const possibleVideoInstances = series._instances.filter(i =>
        sopClassUIDs.includes(i.getData().metadata.SOPClassUID)
      );
      const promises = possibleVideoInstances.map(async (instance, index) => {
        if (index > 0) {
          const seriesWithOneVideoInstance = new OHIFSeriesMetadata(
            series.getData(),
            study
          );
          seriesWithOneVideoInstance.setInstances([instance]);
          study.addSeries(seriesWithOneVideoInstance);

          const displaySet = await getDisplaySetFromSeries(
            seriesWithOneVideoInstance,
            study,
            dicomWebClient,
            headers,
            addDisplaySet,
            true
          );

          if (displaySet && !displaySet.Modality) {
            displaySet.Modality = instance.getTagValue('Modality');
          }

          if (displaySet) {
            addDisplaySet(displaySet);
          }
        }
      });
      await Promise.all(promises);
    };

    if (!skipGenerationOfRemainingDisplaySets) {
      await generateDisplaySetsForRemainingVideoInstances();
    }

    const url = wadouri.replace('dicomweb', 'https');
    const {
      src,
      type,
      dicomData,
      dataset,
      TransferSyntaxUID,
    } = await requestVideoFile({ url });

    if (!supportedTransferSyntaxUIDs.includes(TransferSyntaxUID)) {
      return;
    }

    console.debug('Video type information:', type);
    console.debug(
      'Video TransferSyntax:',
      Object.keys(SupportedTransferSyntaxes).find(
        key => SupportedTransferSyntaxes[key] === TransferSyntaxUID
      )
    );

    /**
     * Note: We are passing the dicomWebClient into each viewport!
     */

    return {
      plugin: 'video',
      Modality,
      displaySetInstanceUID: utils.guid(),
      dicomWebClient,
      SOPInstanceUID,
      SeriesInstanceUID: series.getSeriesInstanceUID(),
      StudyInstanceUID: study.getStudyInstanceUID(),
      referenceInstance: instance,
      wadouri,
      imageId: naturalizedDataset.imageId,
      FrameOfReferenceUID,
      metadata: naturalizedDataset,
      SeriesDescription,
      SeriesDate: ContentDate,
      SeriesTime: ContentTime,
      SeriesNumber,
    };
  },
};

export default DICOMVideoSopClassHandler;
