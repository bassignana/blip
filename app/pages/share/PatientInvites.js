import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { withTranslation } from 'react-i18next';
import forEach from 'lodash/forEach';
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import values from 'lodash/values';
import { Box, Flex, Text } from 'theme-ui';
import SearchIcon from '@material-ui/icons/Search';
import CloseRoundedIcon from '@material-ui/icons/CloseRounded';
import RefreshRoundedIcon from '@material-ui/icons/RefreshRounded';

import {
  MediumTitle,
  Body1,
} from '../../components/elements/FontStyles';

import Button from '../../components/elements/Button';
import Table from '../../components/elements/Table';
import Pagination from '../../components/elements/Pagination';
import TextInput from '../../components/elements/TextInput';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '../../components/elements/Dialog';

import { useToasts } from '../../providers/ToastProvider';
import * as actions from '../../redux/actions';
import { useIsFirstRender } from '../../core/hooks';
import { borders, colors } from '../../themes/baseTheme';

export const PatientInvites = (props) => {
  const { t, api, trackMetric } = props;
  const isFirstRender = useIsFirstRender();
  const dispatch = useDispatch();
  const { set: setToast } = useToasts();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [deleteDialogContent, setDeleteDialogContent] = useState(null);
  const [searchText, setSearchText] = React.useState('');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState();
  const selectedClinicId = useSelector((state) => state.blip.selectedClinicId);
  const loggedInUserId = useSelector((state) => state.blip.loggedInUserId);
  const clinics = useSelector((state) => state.blip.clinics);
  const clinic = get(clinics, selectedClinicId);
  const rowsPerPage = 8;

  const {
    fetchingPatientInvites,
    acceptingPatientInvitation,
    deletingPatientInvitation,
  } = useSelector((state) => state.blip.working);

  function handleAsyncResult(workingState, successMessage) {
    const { inProgress, completed, notification } = workingState;

    if (!isFirstRender && !inProgress) {
      if (completed) {
        setShowDeleteDialog(false);

        setToast({
          message: successMessage,
          variant: 'success',
        });

        setSelectedInvitation(null);
      }

      if (completed === false) {
        setToast({
          message: get(notification, 'message'),
          variant: 'danger',
        });
      }
    }
  }

  useEffect(() => {
    handleAsyncResult(acceptingPatientInvitation, t('Patient invite for {{name}} has been accepted.', {
      name: selectedInvitation?.name,
    }));
  }, [acceptingPatientInvitation]);

  useEffect(() => {
    handleAsyncResult(deletingPatientInvitation, t('Patient invite for {{name}} has been declined.', {
      name: selectedInvitation?.name,
    }));
  }, [deletingPatientInvitation]);

  // Fetchers
  useEffect(() => {
    if (loggedInUserId && clinic) {
      forEach([
        {
          workingState: fetchingPatientInvites,
          action: actions.async.fetchPatientInvites.bind(null, api, clinic.id),
        },
      ], ({ workingState, action }) => {
        if (
          !workingState.inProgress &&
          !workingState.completed &&
          !workingState.notification
        ) {
          dispatch(action());
        }
      });
    }
  }, [loggedInUserId, clinic]);

  useEffect(() => {
    if (clinic) {
      setPendingInvites(map(values(clinic?.patientInvites), invite => ({
        key: invite.key,
        name: get(invite, 'creator.profile.fullName', ''),
        nameOrderable: get(invite, 'creator.profile.fullName', '').toLowerCase(),
        birthday: get(invite, 'creator.profile.patient.birthday', ''),
      })));
    }
  }, [clinic]);

  useEffect(() => {
    setPageCount(Math.ceil(pendingInvites.length / rowsPerPage));
  }, [pendingInvites]);

  useEffect(() => {
    if (selectedInvitation) {
      setDeleteDialogContent({
        title: t('Decline invite?'),
        submitText: t('Decline Invite'),
        body: t('Are you sure you want to decline this share invite from {{patient}}?', { patient: selectedInvitation.name }),
      })
    }
  }, [selectedInvitation]);

  useEffect(() => {
    const { inProgress, completed, notification } = fetchingPatientInvites;

    if (!isFirstRender && !inProgress) {
      if (completed === false) {
        setToast({
          message: get(notification, 'message'),
          variant: 'danger',
        });
      }
    }
  }, [fetchingPatientInvites]);

  function handleAccept(invite) {
    trackMetric('Clinic - Accept patient invite', { clinicId: selectedClinicId });
    dispatch(actions.async.acceptPatientInvitation(api, clinic.id, invite.key));
  }

  function handleDecline(member) {
    trackMetric('Clinic - Decline patient invite', { clinicId: selectedClinicId });
    setSelectedInvitation(member);
    setShowDeleteDialog(true);
  }

  function handleConfirmDecline(invite) {
    trackMetric('Clinic - Decline patient invite confirmed', { clinicId: selectedClinicId });
    dispatch(actions.async.deletePatientInvitation(api, clinic.id, invite.key));
  }

  function handleRefetchInvites() {
    trackMetric('Clinic - Refresh patient invites', { clinicId: selectedClinicId });
    dispatch(actions.async.fetchPatientInvites(api, clinic.id));
  }

  function handleSearchChange(event) {
    setPage(1);
    setSearchText(event.target.value);
    if (isEmpty(event.target.value)) {
      setPageCount(Math.ceil(pendingInvites.length / rowsPerPage));
    }
  }

  function handleClearSearch() {
    setPage(1);
    setSearchText('');
    setPageCount(Math.ceil(pendingInvites.length / rowsPerPage));
  }

  const handlePageChange = (event, newValue) => {
    setPage(newValue);
  };

  const handleTableFilter = (data) => {
    setPageCount(Math.ceil(data.length / rowsPerPage));
  };

  const renderName = ({ name }) => (
    <Box>
      <Text fontWeight={['medium', null, 'regular']}>{name}</Text>
    </Box>
  );

  const renderBirthday = ({ birthday }) => (
    <Box>
      <Text>{birthday}</Text>
    </Box>
  );

  const renderActions = member => (
    <Flex sx={{ justifyContent: 'flex-end' }}>
      <Button
        className="decline-invite"
        onClick={() => handleDecline(member)}
        processing={deletingPatientInvitation.inProgress && member.key === selectedInvitation.key}
        variant="secondary"
      >
        {t('Decline')}
      </Button>

      <Button
        className="accept-invite"
        onClick={() => {
          setSelectedInvitation(member);
          handleAccept(member);
        }}
        processing={acceptingPatientInvitation.inProgress && member.key === selectedInvitation.key}
        variant="primary"
        sx={{ color: 'purpleMedium', bg: 'white' }}
        ml={2}
      >
        {t('Accept')}
      </Button>
    </Flex>
  );

  const columns = [
    {
      title: t('Name'),
      field: 'nameOrderable',
      align: 'left',
      sortable: true,
      sortBy: 'nameOrderable',
      searchable: true,
      render: renderName,
    },
    {
      title: t('Birthday'),
      field: 'birthday',
      align: 'left',
      sortable: true,
      sortBy: 'birthday',
      render: renderBirthday,
      className: 'justify-flex-start'
    },
    {
      title: '',
      field: 'actions',
      render: renderActions,
      align: 'left',
      className: 'justify-flex-end action-buttons'
    },
  ];

  return (
    <>
      <Box mb={4} flex={1} sx={{ position: ['static', null, 'absolute'], top: '8px', right: 4 }}>
        <TextInput
          themeProps={{
            width: ['100%', null, '250px'],
          }}
          fontSize="12px"
          id="search-invites"
          placeholder={t('Search by Name')}
          icon={!isEmpty(searchText) ? CloseRoundedIcon : SearchIcon}
          iconLabel={t('Search')}
          onClickIcon={!isEmpty(searchText) ? handleClearSearch : null}
          name="search-invites"
          onChange={handleSearchChange}
          value={searchText}
          variant="condensed"
        />
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Table
          id="patientInvitesTable"
          label={t('Clinician Table')}
          columns={columns}
          data={pendingInvites}
          orderBy="nameOrderable"
          order="asc"
          rowHover={false}
          rowsPerPage={rowsPerPage}
          searchText={searchText}
          page={page}
          onFilter={handleTableFilter}
          emptyText={null}
          sx={{ fontSize: 1 }}
        />

        {pendingInvites.length > rowsPerPage && (
          <Pagination
            px="5%"
            sx={{ position: 'absolute', bottom: '-50px' }}
            width="100%"
            id="clinic-invites-pagination"
            count={pageCount}
            page={page}
            disabled={pageCount < 2}
            onChange={handlePageChange}
            showFirstButton={false}
            showLastButton={false}
          />
        )}

        {pendingInvites.length === 0 && (
          <Box id="no-invites" pt={3} mb={4} sx={{ borderTop: borders.divider }}>
            <Text p={3} fontSize={1} color="text.primary" sx={{ textAlign: 'center' }}>
              {t('There are no invites. Refresh to check for pending invites.')}
            </Text>

            <Flex sx={{ justifyContent: 'center' }}>
              <Button
                id="refresh-invites"
                variant="secondary"
                icon={RefreshRoundedIcon}
                iconPosition="left"
                processing={fetchingPatientInvites.inProgress}
                onClick={handleRefetchInvites}
                sx={{
                  '&:hover,&:active,&.active,&.processing': {
                    color: colors.purpleMedium,
                    backgroundColor: colors.white,
                    borderColor: colors.purpleMedium,
                  },
                }}
              >
                {t('Refresh')}
              </Button>
            </Flex>
          </Box>
        )}

        <Dialog
          id="declinePatientInvite"
          aria-labelledby="dialog-title"
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
        >
          <DialogTitle onClose={() => setShowDeleteDialog(false)}>
            <MediumTitle id="dialog-title">{deleteDialogContent?.title}</MediumTitle>
          </DialogTitle>
          <DialogContent>
            <Body1>
              {deleteDialogContent?.body}
            </Body1>
          </DialogContent>
          <DialogActions>
            <Button variant="secondary" onClick={() => setShowDeleteDialog(false)}>
              {t('Cancel')}
            </Button>
            <Button
              className="decline-invite"
              variant="danger"
              processing={deletingPatientInvitation.inProgress}
              onClick={() => {
                handleConfirmDecline(selectedInvitation);
              }}
            >
              {deleteDialogContent?.submitText}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

PatientInvites.propTypes = {
  api: PropTypes.object.isRequired,
  trackMetric: PropTypes.func.isRequired,
};

export default withTranslation()(PatientInvites);
