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

import update from 'immutability-helper';

import * as actionTypes from '../constants/actionTypes';

const pdf = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.GENERATE_PDF_SUCCESS:
      return update(state, { $merge: action.payload.pdf });

    case actionTypes.GENERATE_AGP_IMAGES_REQUEST:
      return update(state, { $merge: action.payload });

    case actionTypes.GENERATE_AGP_IMAGES_SUCCESS: {
      let newOpts = { ...state.opts, svgDataURLS: action.payload.images };
      return update(state, { $merge: { opts: newOpts } });
    }

    case actionTypes.GENERATE_AGP_IMAGES_FAILURE:
    case actionTypes.REMOVE_GENERATED_PDFS:
      return update(state, { $set: {} });

    default:
      return state;
  }
};

export default pdf;
