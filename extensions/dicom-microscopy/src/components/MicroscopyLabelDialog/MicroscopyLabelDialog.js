import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SimpleDialog, TextInput } from '@ohif/ui';

import './MicroscopyLabelDialog.styl';

const MicroscopyLabelDialog = ({
  title,
  onSubmit,
  onClose,
  label,
  defaultValue = '',
}) => {
  const [value, setValue] = useState(defaultValue);
  const onSubmitHandler = () => onSubmit(value);

  return (
    <div className="InputDialog MicroscopyLabelDialog">
      <SimpleDialog
        headerTitle={title}
        onClose={onClose}
        onConfirm={onSubmitHandler}
      >
        <TextInput
          type="text"
          value={value}
          onChange={event => setValue(event.target.value)}
          label={label}
          autoComplete="off"
          autoFocus
          onFocus={e => e.currentTarget.select()}
        />
      </SimpleDialog>
    </div>
  );
};

MicroscopyLabelDialog.propTypes = {
  title: PropTypes.string,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  label: PropTypes.string,
  defaultValue: PropTypes.string,
};

export default MicroscopyLabelDialog;
