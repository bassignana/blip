import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { translate } from 'react-i18next';
import get from 'lodash/get';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import keys from 'lodash/keys';
import keyBy from 'lodash/keyBy';
import map from 'lodash/map';
import reject from 'lodash/reject';
import { Box, Text } from 'rebass/styled-components';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import EditIcon from '@material-ui/icons/EditRounded';
import { components as vizComponents, utils as vizUtils } from '@tidepool/viz';
import ScrollToTop from 'react-scroll-to-top';
import styled from 'styled-components';
import {
  MediumTitle,
  Body1,
  Title,
} from '../../components/elements/FontStyles';

import Button from '../../components/elements/Button';
import Table from '../../components/elements/Table';
import { TagList } from '../../components/elements/Tag';
import TideDashboardConfigForm from '../../components/clinic/TideDashboardConfigForm';
import BgSummaryCell from '../../components/clinic/BgSummaryCell';
import PopoverMenu from '../../components/elements/PopoverMenu';
import utils from '../../core/utils';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '../../components/elements/Dialog';

import * as actions from '../../redux/actions';
import { useToasts } from '../../providers/ToastProvider';
import { useIsFirstRender, useLocalStorage, usePrevious } from '../../core/hooks';
import { fieldsAreValid } from '../../core/forms';

import {
  patientSchema as validationSchema,
  tideDashboardConfigSchema,
} from '../../core/clinicUtils';

import { MGDL_UNITS } from '../../core/constants';
import { colors } from '../../themes/baseTheme';

const { Loader } = vizComponents;
const { formatBgValue } = vizUtils.bg;

const StyledScrollToTop = styled(ScrollToTop)`
  background-color: ${colors.purpleMedium};
  right: 20px;
  bottom: 70px;
  border-radius: 20px;
  padding-top: 4px;
`;

const prefixPopHealthMetric = metric => `Clinic - Population Health - ${metric}`;

const editPatient = (patient, setSelectedPatient, selectedClinicId, trackMetric, setShowEditPatientDialog, source) => {
  trackMetric('Clinic - Edit patient', { clinicId: selectedClinicId, source });
  setSelectedPatient(patient);
  setShowEditPatientDialog(true);
};

const MoreMenu = ({
  patient,
  selectedClinicId,
  t,
  trackMetric,
  setSelectedPatient,
  setShowEditPatientDialog,
}) => {
  const handleEditPatient = useCallback(() => {
    editPatient(patient, setSelectedPatient, selectedClinicId, trackMetric, setShowEditPatientDialog, 'action menu');
  }, [patient, setSelectedPatient, selectedClinicId, trackMetric, setShowEditPatientDialog]);

  const items = useMemo(() => ([{
    icon: EditIcon,
    iconLabel: t('Edit Patient Information'),
    iconPosition: 'left',
    id: `edit-${patient.id}`,
    variant: 'actionListItem',
    onClick: (_popupState) => {
      _popupState.close();
      handleEditPatient(patient);
    },
    text: t('Edit Patient Information'),
  }]), [
    handleEditPatient,
    patient,
    t,
  ]);

  return <PopoverMenu id={`action-menu-${patient.id}`} items={items} />;
};


const TideDashboardSection = props => {
  const {
    clinicBgUnits,
    config,
    dispatch,
    patients,
    patientTags,
    selectedClinicId,
    setSelectedPatient,
    setShowEditPatientDialog,
    t,
    trackMetric,
  } = props;

  const statEmptyText = '--';

  const handleSortChange = useCallback((newOrderBy, field) => {
    console.log('sortChange', field, newOrderBy);
    // TODO: proper metric...
    trackMetric(prefixPopHealthMetric('NEW SORT'), { clinicId: selectedClinicId });
  }, [
    selectedClinicId,
    trackMetric,
  ]);

  const handleClickPatient = useCallback(patient => {
    return () => {
      trackMetric('Selected PwD');
      dispatch(push(`/patients/${patient.id}/data`));
    }
  }, [dispatch, trackMetric]);

  const renderPatientName = useCallback(({ patient }) => (
    <Box onClick={handleClickPatient(patient)} sx={{ cursor: 'pointer' }}>
      <Text fontSize={[1, null, 0]} fontWeight="medium">{patient.fullName}</Text>
    </Box>
  ), [handleClickPatient]);

  const renderAverageGlucose = useCallback(summary => {
    const averageGlucose = summary?.averageGlucose;
    const bgPrefs = { bgUnits: clinicBgUnits };

    const formattedAverageGlucose = clinicBgUnits === averageGlucose?.units
      ? formatBgValue(averageGlucose?.value, bgPrefs)
      : formatBgValue(utils.translateBg(averageGlucose?.value, clinicBgUnits), bgPrefs);

    return averageGlucose ? (
      <Box className="patient-average-glucose">
        <Text as="span" fontWeight="medium">{formattedAverageGlucose}</Text>
      </Box>
    ) : null;
  }, [clinicBgUnits]);

  const renderGMI = useCallback(summary => {
    const cgmUsePercent = (summary?.timeCGMUsePercent || 0);
    const cgmHours = (summary?.timeCGMUseMinutes || 0) / 60;
    const gmi = summary?.glucoseManagementIndicator;
    const minCgmHours = 24;
    const minCgmPercent = 0.7;
    let formattedGMI = gmi ? utils.formatDecimal(gmi, 1) : statEmptyText;

    if (includes(['1d', '7d'], config?.period)
      || cgmUsePercent < minCgmPercent
      || cgmHours < minCgmHours
    ) formattedGMI = statEmptyText;

    return (
      <Box classname="patient-gmi">
        <Text as="span" fontWeight="medium">{formattedGMI}</Text>
        {formattedGMI !== statEmptyText && <Text as="span" fontSize="10px"> %</Text>}
      </Box>
    );
  }, [config?.period]);

  const renderTimeInLowPercent = useCallback(summary => {
    const timeInLowPercent = (summary?.timeInLowPercent || 0);
    let formattedTimeInLowPercent = timeInLowPercent ? utils.formatDecimal(timeInLowPercent * 100, 1) : statEmptyText;

    return (
      <Box classname="patient-sensor-usage">
        <Text as="span" fontWeight="medium">{formattedTimeInLowPercent}</Text>
        {formattedTimeInLowPercent !== statEmptyText && <Text as="span" fontSize="10px"> %</Text>}
      </Box>
    );
  }, []);

  const renderTimeInVeryLowPercent = useCallback(summary => {
    const timeInVeryLowPercent = (summary?.timeInVeryLowPercent || 0);
    let formattedTimeInVeryLowPercent = timeInVeryLowPercent ? utils.formatDecimal(timeInVeryLowPercent * 100, 1) : statEmptyText;

    return (
      <Box classname="patient-sensor-usage">
        <Text as="span" fontWeight="medium">{formattedTimeInVeryLowPercent}</Text>
        {formattedTimeInVeryLowPercent !== statEmptyText && <Text as="span" fontSize="10px"> %</Text>}
      </Box>
    );
  }, []);

  const renderSensorUsage = useCallback(summary => {
    const cgmUsePercent = (summary?.timeCGMUsePercent || 0);
    let formattedSensorUsage = cgmUsePercent ? utils.formatDecimal(cgmUsePercent * 100) : statEmptyText;

    return (
      <Box classname="patient-sensor-usage">
        <Text as="span" fontWeight="medium">{formattedSensorUsage}</Text>
        {formattedSensorUsage !== statEmptyText && <Text as="span" fontSize="10px"> %</Text>}
      </Box>
    );
  }, []);

  const renderPatientTags = useCallback(({ patient }) => {
    const filteredPatientTags = reject(patient?.tags || [], tagId => !patientTags[tagId]);

    return (
      <TagList
          maxCharactersVisible={16}
          popupId={`tags-overflow-${patient?.id}`}
          tagProps={{ variant: 'compact' }}
          tags={map(filteredPatientTags, tagId => patientTags?.[tagId])}
      />
    );
  }, [patientTags]);

  const renderBgRangeSummary = useCallback(summary => {
    return <BgSummaryCell
      summary={summary}
      clinicBgUnits={clinicBgUnits}
      activeSummaryPeriod={config?.period}
      t={t} />
  }, [clinicBgUnits, config?.period, t]);

  const renderMore = useCallback(({ patient }) => {
    return <MoreMenu
      patient={patient}
      selectedClinicId={selectedClinicId}
      t={t}
      trackMetric={trackMetric}
      setSelectedPatient={setSelectedPatient}
      setShowEditPatientDialog={setShowEditPatientDialog}
      prefixPopHealthMetric={prefixPopHealthMetric}
    />;
  }, [
    selectedClinicId,
    t,
    trackMetric,
    setSelectedPatient,
    setShowEditPatientDialog,
  ]);

  const columns = useMemo(() => {
    const cols = [
      {
        title: t('Patient Name'),
        field: 'patient.fullName',
        align: 'left',
        render: renderPatientName,
      },
      {
        title: t('Avg. Glucose'),
        field: 'averageGlucose',
        align: 'center',
        render: renderAverageGlucose,
      },
      {
        title: t('GMI'),
        field: 'glucoseManagementIndicator',
        align: 'center',
        render: renderGMI,
      },
      {
        title: t('% CGM Use'),
        field: 'timeCGMUsePercent',
        align: 'center',
        render: renderSensorUsage,
      },
      {
        title: t('% Time below 54'), // TODO: threshold in clinic BG units
        field: 'timeInVeryLowPercent',
        align: 'center',
        render: renderTimeInVeryLowPercent,
      },
      {
        title: t('% Time below 70'), // TODO: threshold in clinic BG units
        field: 'timeInLowPercent',
        align: 'center',
        render: renderTimeInLowPercent,
      },
      {
        title: t('% Time in Range'),
        field: 'bgRangeSummary',
        align: 'center',
        render: renderBgRangeSummary,
      },
      {
        title: t('Tags'),
        field: 'patient.tags',
        align: 'left',
        render: renderPatientTags,
      },
      {
        title: '',
        field: 'more',
        render: renderMore,
        align: 'right',
        className: 'action-menu',
      },
    ];

    return cols;
  }, [
    renderAverageGlucose,
    renderBgRangeSummary,
    renderGMI,
    renderMore,
    renderPatientName,
    renderPatientTags,
    renderSensorUsage,
    t,
  ]);

  return (
    <Table
      id={'peopleTable'}
      variant="condensed"
      label={'peopletablelabel'}
      columns={columns}
      data={patients}
      style={{ fontSize: '12px' }}
      onSort={handleSortChange}
    />
  );
};

export const TideDashboard = (props) => {
  const { t, api, trackMetric } = props;
  const isFirstRender = useIsFirstRender();
  const dispatch = useDispatch();
  const { set: setToast } = useToasts();
  const selectedClinicId = useSelector((state) => state.blip.selectedClinicId);
  const loggedInUserId = useSelector((state) => state.blip.loggedInUserId);
  const clinic = useSelector(state => state.blip.clinics?.[selectedClinicId]);
  const { config, results: patientGroups } = useSelector((state) => state.blip.tideDashboardPatients);
  const [showTideDashboardConfigDialog, setShowTideDashboardConfigDialog] = useState(false);
  const [showEditPatientDialog, setShowEditPatientDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientFormContext, setPatientFormContext] = useState();
  const [tideDashboardFormContext, setTideDashboardFormContext] = useState();
  const [clinicBgUnits, setClinicBgUnits] = useState(MGDL_UNITS);
  const [localConfig] = useLocalStorage('tideDashboardConfig', {});
  const patientTags = useMemo(() => keyBy(clinic?.patientTags, 'id'), [clinic?.patientTags]);

  const {
    fetchingPatientFromClinic,
    updatingClinicPatient,
    fetchingTideDashboardPatients,
  } = useSelector((state) => state.blip.working);

  const previousUpdatingClinicPatient = usePrevious(updatingClinicPatient);
  const previousFetchingTideDashboardPatients = usePrevious(fetchingTideDashboardPatients);

  const handleAsyncResult = useCallback((workingState, successMessage, onComplete = handleCloseOverlays) => {
    const { inProgress, completed, notification, prevInProgress } = workingState;

    if (!isFirstRender && !inProgress && prevInProgress !== false) {
      if (completed) {
        onComplete();
        successMessage && setToast({
          message: successMessage,
          variant: 'success',
        });
      }

      if (completed === false) {
        setToast({
          message: get(notification, 'message'),
          variant: 'danger',
        });
      }
    }
  }, [isFirstRender, setToast]);

  useEffect(() => {
    setClinicBgUnits((clinic?.preferredBgUnits || MGDL_UNITS));
  }, [clinic]);

  useEffect(() => {
    const options = localConfig?.[loggedInUserId];
    options.mockData = true; // TODO: delete temp mocked data response
    if (options) {
      dispatch(actions.async.fetchTideDashboardPatients(api, selectedClinicId, options));
    }
  }, [api, dispatch, localConfig, selectedClinicId, loggedInUserId]);

  useEffect(() => {
    handleAsyncResult({ ...fetchingTideDashboardPatients, prevInProgress: previousFetchingTideDashboardPatients?.inProgress }, null, () => setLoading(false));
  }, [fetchingTideDashboardPatients, handleAsyncResult, previousFetchingTideDashboardPatients?.inProgress]);

  function handlePatientFormChange(formikContext) {
    setPatientFormContext({...formikContext});
  }

  const handleEditPatientConfirm = useCallback(() => {
    trackMetric('Clinic - Edit patient confirmed', { clinicId: selectedClinicId });
    const updatedTags = [...(patientFormContext?.values?.tags || [])];
    const existingTags = [...(selectedPatient?.tags || [])];

    if (!isEqual(updatedTags.sort(), existingTags.sort())) {
      trackMetric(prefixPopHealthMetric('Edit patient tags confirm'), { clinicId: selectedClinicId });
    }
    patientFormContext?.handleSubmit();
  }, [patientFormContext, selectedClinicId, trackMetric, selectedPatient?.tags]);

  function handleConfigureTideDashboard() {
    trackMetric('Clinic - Show Tide Dashboard config dialog', { clinicId: selectedClinicId, source: 'Tide dashboard' });
    setShowTideDashboardConfigDialog(true);
  }

  const handleConfigureTideDashboardConfirm = useCallback(() => {
    trackMetric('Clinic - Show Tide Dashboard config dialog confirmed', { clinicId: selectedClinicId });
    tideDashboardFormContext?.handleSubmit();
  }, [tideDashboardFormContext, selectedClinicId, trackMetric]);

  function handleTideDashboardConfigFormChange(formikContext) {
    setTideDashboardFormContext({...formikContext});
  }

  const renderHeader = () => (
    <Box>
      <Title>{t('TIDE Dashboard')}</Title>
      <Body1>{'April 3 - April 9, 2023'}</Body1>
    </Box>
  )

  const renderTideDashboardConfigDialog = useCallback(() => {
    return (
      <Dialog
        id="addPatient"
        aria-labelledby="dialog-title"
        open={showTideDashboardConfigDialog}
        onClose={handleCloseOverlays}
        maxWidth="sm"
      >
        <DialogTitle onClose={handleCloseOverlays}>
          <MediumTitle fontSize={2} id="dialog-title">{t('Add patients from your clinic to view in your TIDE Dashboard')}</MediumTitle>
        </DialogTitle>

        <DialogContent>
          <TideDashboardConfigForm api={api} trackMetric={trackMetric} onFormChange={handleTideDashboardConfigFormChange} />
        </DialogContent>

        <DialogActions>
          <Button
            id="configureTideDashboardConfirm"
            variant="primary"
            onClick={handleConfigureTideDashboardConfirm}
            processing={fetchingTideDashboardPatients.inProgress}
            disabled={!fieldsAreValid(keys(tideDashboardFormContext?.values), tideDashboardConfigSchema, tideDashboardFormContext?.values)}
          >
            {t('Next')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }, [
    api,
    fetchingTideDashboardPatients.inProgress,
    handleConfigureTideDashboardConfirm,
    tideDashboardFormContext?.values,
    showTideDashboardConfigDialog,
    t,
    trackMetric
  ]);

  const renderEditPatientDialog = useCallback(() => {
    return (
      <Dialog
        id="editPatient"
        aria-labelledby="dialog-title"
        open={showEditPatientDialog}
        onClose={handleCloseOverlays}
      >
        <DialogTitle onClose={() => {
          trackMetric('Clinic - Edit patient close', { clinicId: selectedClinicId });
          handleCloseOverlays()
        }}>
          <MediumTitle id="dialog-title">{t('Edit Patient Details')}</MediumTitle>
        </DialogTitle>

        <DialogContent>
          <PatientForm api={api} trackMetric={trackMetric} onFormChange={handlePatientFormChange} patient={selectedPatient} />
        </DialogContent>

        <DialogActions>
          <Button id="editPatientCancel" variant="secondary" onClick={() => {
            trackMetric('Clinic - Edit patient cancel', { clinicId: selectedClinicId });
            handleCloseOverlays()
          }}>
            {t('Cancel')}
          </Button>

          <Button
            id="editPatientConfirm"
            variant="primary"
            onClick={handleEditPatientConfirm}
            processing={updatingClinicPatient.inProgress}
            disabled={!fieldsAreValid(keys(patientFormContext?.values), validationSchema, patientFormContext?.values)}
          >
            {t('Save Changes')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }, [
    api,
    handleEditPatientConfirm,
    patientFormContext?.values,
    selectedClinicId,
    selectedPatient,
    showEditPatientDialog,
    t,
    trackMetric,
    updatingClinicPatient.inProgress
  ]);

  function handleCloseOverlays() {
    setShowTideDashboardConfigDialog(false);

    setTimeout(() => {
      setSelectedPatient(null);
    });
  }

  const renderPatientGroups = useCallback(() => {
    const sectionProps = {
      clinicBgUnits,
      config,
      dispatch,
      patientTags,
      selectedClinicId,
      setSelectedPatient,
      setShowEditPatientDialog,
      t,
      trackMetric,
    };

    const sections = [
      'timeInVeryLowPercent',
      'timeInLowPercent',
      'dropInTimeInTargetPercent',
      'timeInTargetPercent',
      'timeCGMUsePercent',
      'meetingTargets',
    ];

    return (
      <Box id="tide-dashboard-patient-groups">
        {map(sections, section => (
          <TideDashboardSection
            key={section}
            id={`group-${section}`}
            patients={patientGroups[section]}
            {...sectionProps}
          />
        ))}
      </Box>
    );
  }, [
    clinicBgUnits,
    config,
    dispatch,
    patientGroups,
    patientTags,
    selectedClinicId,
    setSelectedPatient,
    setShowEditPatientDialog,
    t,
    trackMetric,
  ]);

  return (
    <Box
      id="tide-dashboard"
      alignItems="center"
      variant="containers.largeBordered"
      minHeight="80vh"
      mb={9}
    >
      <Loader show={loading} overlay={true} />
      {renderHeader()}
      {patientGroups && renderPatientGroups()}
      {showTideDashboardConfigDialog && renderTideDashboardConfigDialog()}
      {showEditPatientDialog && renderEditPatientDialog()}

      <StyledScrollToTop
        smooth
        top={600}
        component={<ArrowUpwardIcon />}
      />
    </Box>
  );
};

TideDashboard.propTypes = {
  api: PropTypes.object.isRequired,
  trackMetric: PropTypes.func.isRequired,
  searchDebounceMs: PropTypes.number.isRequired,
};

TideDashboard.defaultProps = {
  searchDebounceMs: 1000,
};

export default translate()(TideDashboard);