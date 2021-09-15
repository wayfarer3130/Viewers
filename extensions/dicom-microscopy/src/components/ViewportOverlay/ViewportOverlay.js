import React from 'react';

import './ViewportOverlay.css';
import { formatPatientName } from './utils.js';

const ViewportOverlay = ({ metadata }) => {
  let identifier;
  let patientName;
  let patientId;
  let specimenShortDescription;
  let specimenDetailedDescription;

  if (metadata) {
    patientName = metadata.PatientName;
    patientId = metadata.PatientID;

    if (patientName && patientName.Alphabetic) {
      patientName = patientName.Alphabetic;
    }

    if (metadata.SpecimenDescriptionSequence) {
      const {
        SpecimenShortDescription,
        SpecimenDetailedDescription,
        SpecimenIdentifier,
        SpecimenUID,
      } = metadata.SpecimenDescriptionSequence;
      identifier = SpecimenIdentifier || SpecimenUID;
      specimenShortDescription = SpecimenShortDescription;
      specimenDetailedDescription = SpecimenDetailedDescription;
    }
  }

  return (
    <div className="ViewportOverlay">
      <div className="box">
        <span>{formatPatientName(patientName)}</span>
        <span>{patientId}</span>
      </div>
      <div className="box"></div>
      <div className="box">
        <span>{identifier}</span>
        <span>{specimenShortDescription}</span>
        <span>{specimenDetailedDescription}</span>
      </div>
      <div className="box"></div>
    </div>
  );
};

export default ViewportOverlay;
