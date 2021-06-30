import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Flex } from 'rebass/styled-components'
import { translate } from 'react-i18next';

import _ from 'lodash';
import cx from 'classnames';

import personUtils from '../../core/personutils';
import NavbarPatientCard from '../../components/navbarpatientcard';
import WorkspaceSwitcher from '../../components/clinic/WorkspaceSwitcher';

import logoSrc from './images/tidepool-logo-408x46.png';
export default translate()(class extends React.Component {
  static propTypes = {
    currentPage: PropTypes.string,
    user: PropTypes.object,
    fetchingUser: PropTypes.bool,
    patient: PropTypes.object,
    fetchingPatient: PropTypes.bool,
    getUploadUrl: PropTypes.func,
    onLogout: PropTypes.func,
    trackMetric: PropTypes.func.isRequired,
    permsOfLoggedInUser: PropTypes.object,
  };

  state = {
    showDropdown: false,
  };

  render() {
    return (
      <div className="Navbar">
        {this.renderLogoSection()}
        {this.renderMiddleSection()}
        {this.renderMenuSection()}
      </div>
    );
  }

  renderLogoSection = () => {
    return (
      <div className="Navbar-logoSection">
        {this.renderLogo()}
      </div>
    );
  };

  renderLogo = () => {
    var self = this;
    var handleClick = function() {
      self.props.trackMetric('Clicked Navbar Logo');
    };

    return (
      <Link
        to="/"
        className="Navbar-logo"
        onClick={handleClick}>
        <img src={logoSrc}/>
      </Link>
    );
  };

  getPatientLink = (patient) => {
    if (!patient || !patient.userid) {
      return '';
    }

    return '/patients/' + patient.userid + '/data';
  };

  renderMiddleSection = () => {
    var patient = this.props.patient;

    console.log('this.props.currentPage', this.props.currentPage);

    if (_.isEmpty(patient)) {
      if (
        this.props.currentPage === '/patients' &&
        personUtils.isClinic(this.props.user) &&
        personUtils.flaggedForClinicWorkflow(this.props.user)
      ) {
        return (
          <Flex alignItems="center" justifyContent="center">
            <WorkspaceSwitcher api={this.props.api} />
          </Flex>
        );
      }
      return <div className="Navbar-patientSection"></div>;
    }

    patient.link = this.getPatientLink(patient);

    return (
      <div className="Navbar-patientSection" ref="patient">
        <NavbarPatientCard
          href={patient.link}
          currentPage={this.props.currentPage}
          uploadUrl={this.props.getUploadUrl()}
          patient={patient}
          permsOfLoggedInUser={this.props.permsOfLoggedInUser}
          trackMetric={this.props.trackMetric} />
      </div>
    );
  };

  toggleDropdown = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    this.setState({showDropdown: !this.state.showDropdown});
  };

  stopPropagation = (e) => {
    e.stopPropagation();
  };

  hideDropdown = () => {
    if (this.state.showDropdown) {
      this.setState({showDropdown: false});
    }
  };

  renderMenuSection = () => {
    var currentPage = (this.props.currentPage && this.props.currentPage[0] === '/') ? this.props.currentPage.slice(1) : this.props.currentPage;
    const {user, t} = this.props;

    if (_.isEmpty(user)) {
      return <div className="Navbar-menuSection"></div>;
    }

    var displayName = this.getUserDisplayName();
    var self = this;
    var handleClickUser = function() {
      self.props.trackMetric('Clicked Navbar Logged In User');
      self.setState({showDropdown: false});
    };

    var handleCareteam = function() {
      self.props.trackMetric('Clicked Navbar CareTeam');
    };
    var patientsClasses = cx({
      'Navbar-button': true,
      'Navbar-selected': currentPage && currentPage === 'patients',
    });

    var accountSettingsClasses = cx({
      'Navbar-button': true,
      'Navbar-dropdownIcon-show': currentPage && currentPage === 'profile',
    });

    var dropdownClasses = cx({
      'Navbar-menuDropdown': true,
      'Navbar-menuDropdown-hide': !self.state.showDropdown,
    });

    var dropdownIconClasses = cx({
      'Navbar-dropdownIcon': true,
      'Navbar-dropdownIcon-show': self.state.showDropdown,
      'Navbar-dropdownIcon-current': currentPage && currentPage === 'profile',
    });

    var dropdownIconIClasses = cx({
      'Navbar-icon': true,
      'icon-account--down': !self.state.showDropdown,
      'icon-account--up': self.state.showDropdown,
    });

    return (
      <ul className="Navbar-menuSection" ref="user">
        <li className="Navbar-menuItem">
          <Link to="/patients" title="Care Team" onClick={handleCareteam} className={patientsClasses} ref="careteam"><i className="Navbar-icon icon-careteam"></i></Link>
        </li>
        <li className={dropdownIconClasses}>
          <div onClick={this.toggleDropdown}>
            <i className='Navbar-icon Navbar-icon-profile icon-profile'></i>
            <div className="Navbar-logged">
              <span className="Navbar-loggedInAs">{t('Logged in as ')}</span>
              <span className="Navbar-userName" ref="userFullName" title={displayName}>{displayName}</span>
            </div>
            <i className='Navbar-icon Navbar-icon-down icon-arrow-down'></i>
            <div className='clear'></div>
          </div>
          <div onClick={this.stopPropagation} className={dropdownClasses}>
            <ul>
              <li>
                <Link to="/profile" title={t('Account')} onClick={handleClickUser} className={accountSettingsClasses}>
                  <i className='Navbar-icon icon-settings'></i><span className="Navbar-menuText">{t('Account Settings')}</span>
                </Link>
              </li>
              <li>
                <a href="" title={t('Logout')} onClick={this.handleLogout} className="Navbar-button" ref="logout">
                  <i className='Navbar-icon icon-logout'></i><span className="Navbar-menuText">{t('Logout')}</span>
                </a>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    );
  };

  getUserDisplayName = () => {
    return personUtils.fullName(this.props.user);
  };

  isSamePersonUserAndPatient = () => {
    return personUtils.isSame(this.props.user, this.props.patient);
  };

  handleLogout = (e) => {
    this.setState({showDropdown: false});

    if (e) {
      e.preventDefault();
    }

    var logout = this.props.onLogout;
    if (logout) {
      logout();
    }
  };
});
