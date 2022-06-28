
/**
 * Copyright (c) 2014, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { bindActionCreators } from 'redux';

import _ from 'lodash';
import { validateForm } from '../../core/validation';

import * as actions from '../../redux/actions';

import SimpleForm from '../../components/simpleform';
import personUtils from '../../core/personutils';

export let ClinicianDetails = translate()(class extends React.Component {
  static propTypes = {
    fetchingUser: PropTypes.bool.isRequired,
    onSubmit: PropTypes.func.isRequired,
    trackMetric: PropTypes.func.isRequired,
    user: PropTypes.object,
    working: PropTypes.bool.isRequired
  };

  formInputs = () => {
    const { t } = this.props;
    return [
    {
      name: 'fullName',
      label: t('Full Name'),
      type: 'text',
      placeholder: t('Full name')
    },
    {
      name: 'clinicalRole',
      label: t('Clinical Role'),
      type: 'select',
      value: '',
      placeholder: t('Select Role...'),
      items: [
        {value: 'clinic_manager', label: t('Clinic Manager')},
        {value: 'diabetes_educator', label: t('Diabetes Educator')},
        {value: 'endocrinologist', label: t('Endocrinologist')},
        {value: 'front_desk', label: t('Front Desk')},
        {value: 'information_technology', label: t('IT/Technology')},
        {value: 'medical_assistant', label: t('Medical Assistant')},
        {value: 'nurse', label: t('Nurse/Nurse Practitioner')},
        {value: 'primary_care_physician', label: t('Primary Care Physician')},
        {value: 'physician_assistant', label: t('Physician Assistant')},
        {value: 'other', label: t('Other')}
      ]
    },
  ]};

  componentDidMount() {
    if (this.props.trackMetric) {
      this.props.trackMetric('Web - Clinician Details Setup');
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      formValues: _.assign(this.state.formValues, {
        fullName: this.getUserFullName(nextProps)
      })
    });
  }

  getUserFullName = (props) => {
    props = props || this.props;
    return personUtils.fullName(props.user) || '';
  };

  canSubmit = () => {
    if (
      _.get(this,'state.formValues.fullName.length') &&
      _.get(this,'state.formValues.clinicalRole.length')
    )
      {
        return true;
      } else {
        return false;
      }
  };

  render() {
    const { t } = this.props;
    var form = this.renderForm();

    return (
      <div className="ClinicianDetails">
        <div className="container-box-outer ClinicianDetails-contentOuter">
          <div className="container-box-inner ClinicianDetails-contentInner">
            <div className="ClinicianDetails-content">
              <div className="ClinicianDetails-head">
                {t('Clinician Setup')}
              </div>
              <div className="ClinicianDetails-subTitle">
                {t('Please complete these details.')}
              </div>
              <div className="ClinicianDetails-desc">
                {t('We use these details to identify you to your patients and to better support you.')}
              </div>
              {form}
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderForm = () => {
    return (
      <SimpleForm
        inputs={this.formInputs()}
        formValues={this.state.formValues}
        validationErrors={this.state.validationErrors}
        submitButtonText={this.getSubmitButtonText()}
        submitDisabled={this.props.working || !this.canSubmit()}
        onSubmit={this.handleSubmit}
        onChange={this.handleInputChange}
      />
    );
  };

  getSubmitButtonText = () => {
    const { t } = this.props;
    if (this.props.working) {
      return t('Saving...');
    }
    return t('Continue');
  };

  isFormDisabled = () => {
    return (this.props.fetchingUser && !this.props.user);
  };

  handleInputChange = (attributes) => {
    var key = attributes.name;
    var value = attributes.value;
    if (!key) {
      return;
    }

    var formValues = _.clone(this.state.formValues);

    formValues[key] = value;

    this.setState({formValues: formValues});
  };

  handleSubmit = (formValues) => {
    this.resetFormStateBeforeSubmit(formValues);

    var validationErrors = this.validateFormValues(formValues);

    if (!_.isEmpty(validationErrors)) {
      return;
    }

    var user = {
      fullName: formValues.fullName,
      profile: {
        fullName: formValues.fullName,
        clinic: {
          role: formValues.clinicalRole,
        }
      }
    };
    this.props.onSubmit(user);
  };

  validateFormValues = (formValues) => {
    var form = [
      { type: 'name', name: 'fullName', label: 'full name', value: formValues.fullName },
      { type: 'clinicalRole', name: 'clinicalRole', label: 'clinical role', value: formValues.clinicalRole }
    ];
    var validationErrors = validateForm(form);

    if (!_.isEmpty(validationErrors)) {
      this.setState({
        validationErrors: validationErrors
      });
    }

    return validationErrors;
  };

  resetFormStateBeforeSubmit = (formValues) => {
    this.setState({
      working: true,
      formValues: formValues,
      validationErrors: {}
    });
  };

  state = {
    working: false,
    formValues: {
      fullName: this.getUserFullName(),
      clinicalRole: ''
    },
    validationErrors: {},
  };
});

/**
 * Expose "Smart" Component that is connect-ed to Redux
 */

export function mapStateToProps(state) {
  var user = null;
  if (state.blip.allUsersMap){
    if (state.blip.loggedInUserId) {
      user = state.blip.allUsersMap[state.blip.loggedInUserId];
    }
  }

  return {
    user: user,
    fetchingUser: state.blip.working.fetchingUser.inProgress,
    working: state.blip.working.updatingUser.inProgress,
  };
}

let mapDispatchToProps = dispatch => bindActionCreators({
  updateClinicianProfile: actions.async.updateClinicianProfile
}, dispatch);

let mergeProps = (stateProps, dispatchProps, ownProps) => {
  var api = ownProps.api;
  return Object.assign({}, stateProps, {
    onSubmit: dispatchProps.updateClinicianProfile.bind(null, api),
    trackMetric: ownProps.trackMetric,
  });
};

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(ClinicianDetails);
