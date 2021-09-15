import React, { useState } from 'react';
import { SimpleDialog, TextInput, Select } from '@ohif/ui';
import PropTypes from 'prop-types';

import './CalibrationContent.styl';

const unitOptions = [
  {
    key: 'um',
    value: 'um',
  },
  {
    key: 'mm',
    value: 'mm',
  },
  {
    key: 'cm',
    value: 'cm',
  },
  {
    key: 'm',
    value: 'm',
  },
];
export default function CalibrationContent({
  onSubmit,
  defaultValue = '',
  title,
  label,
  onClose,
}) {
  const [value, setValue] = useState(defaultValue);
  const [unitValue, setUnitValue] = useState(unitOptions[1].value);
  const onSubmitHandler = () => {
    onSubmit(value, unitValue);
  };

  return (
    <div className="InputDialog">
      <SimpleDialog
        headerTitle={title}
        onClose={onClose}
        onConfirm={onSubmitHandler}
      >
        <TextInput
          type="number"
          value={value}
          onChange={event => setValue(event.target.value)}
          label={label}
        />
        <Select
          options={unitOptions}
          onChange={event => setUnitValue(event.target.value)}
          value={unitValue}
        ></Select>
      </SimpleDialog>
    </div>
  );
}
CalibrationContent.propTypes = {
  title: PropTypes.string,
  label: PropTypes.string,
  onSubmit: PropTypes.func,
};
