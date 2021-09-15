import React from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

/**
 * Search button component to trigger the study search
 *
 * @param {object} props
 * @param {function} props.fetchStudies method to fetch the studies using the filters
 * @returns {React.Component} returns the search button component
 */
function SearchBtn({ fetchStudies }) {
  const { t, ready: translationsAreReady } = useTranslation('StudyList');

  return translationsAreReady ? (
    <div className="form-inline" style={{ padding: '0 20px' }} >
      <button className="btn btn-primary" onClick={fetchStudies} >
        {t('Search')}
      </button>
    </div>
  ) : null;
}

SearchBtn.propTypes = {
  fetchStudies: PropTypes.func.isRequired
};

export { SearchBtn };
