/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2017, Tidepool Project
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
 * == BSD2 LICENSE ==
 */

import PropTypes from 'prop-types';
import React from 'react';
import { Flex, Link, Text } from 'rebass/styled-components';

import { ReactComponent as FacebookLogo } from './images/fb_logo.svg';
import { ReactComponent as XLogo } from './images/x_logo.svg';
import { ReactComponent as JDRFLogo } from './images/jdrf_logo.svg';
import i18next from '../../core/language';

const t = i18next.t.bind(i18next);

const FooterLinks = (props) => {
  const linkStyles = {
    fontSize: '11px',
    color: 'grays.5',
    fontWeight: 'medium',
    whiteSpace: 'nowrap',
    '&:hover': {
      color: 'text.primary',
      path: { fill: 'text.primary' },
    },
  };

  const metricFnMkr = (link) => {
    return () => { props.trackMetric(`Clicked Footer ${link}`); };
  };

  return (
    <Flex
      variant="containers.large"
      mb={3}
      sx={{
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: ['center', 'space-evenly'],
        alignItems: 'center',
        gap: 3,
        background: 'transparent',
      }}
    >
      <Flex sx={{ alignItems: 'center', justifyContent: 'space-around', gap: 3, order: [2, 2, 1] }}>
        <Link
          sx={linkStyles}
          className='footer-x'
          href="https://twitter.com/tidepool_org"
          id='twitter'
          onClick={metricFnMkr('Twitter')}
          target="_blank"
          rel="noreferrer noopener"
        >
          <XLogo />
        </Link>
        <Link
          sx={linkStyles}
          className='footer-facebook'
          href="https://www.facebook.com/TidepoolOrg"
          id='facebook'
          onClick={metricFnMkr('Facebook')}
          target="_blank"
          rel="noreferrer noopener"
        >
          <FacebookLogo />
        </Link>
      </Flex>

      <Flex sx={{ alignItems: 'center', justifyContent: 'center', gap: 5, order: [1, 1, 2], flexBasis: ['100%', '100%', 'auto'] }}>
        <Link
          sx={linkStyles}
          href="http://tidepool.org/products/tidepool-mobile/"
          id='mobile'
          onClick={metricFnMkr('Mobile App')}
          target="_blank"
          rel="noreferrer noopener"
        >
          {t('Get Mobile App')}
        </Link>

        <Link
          sx={linkStyles}
          href="http://support.tidepool.org/"
          id='support'
          onClick={metricFnMkr('Support')}
          target="_blank"
          rel="noreferrer noopener"
        >
          {t('Get Support')}
        </Link>

        <Link
          sx={linkStyles}
          href='http://tidepool.org/legal/'
          id='legal'
          onClick={metricFnMkr('PP and TOU')}
          target='_blank'
          rel="noreferrer noopener"
        >
          {t('Privacy and Terms of Use')}
        </Link>
      </Flex>

      <Flex sx={{ alignItems: 'center', justifyContent: 'space-between', order: 3 }}>
        <Link
          sx={linkStyles}
          href='http://jdrf.org/'
          id='jdrf'
          onClick={metricFnMkr('JDRF')}
          target='_blank'
          rel="noreferrer noopener"
        >
          <Flex sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Text>{t('Made possible by')}</Text>
            <JDRFLogo />
          </Flex>
        </Link>
      </Flex>
    </Flex>
  );
};

FooterLinks.propTypes = {
  trackMetric: PropTypes.func.isRequired,
};

export default FooterLinks;
