/* global __ROLLBAR_POST_CLIENT_TOKEN__, __VERSION_SHA__, __API_HOST__, __PROD__ */
import Rollbar from 'rollbar';

let rollbar = {};

if (__PROD__) {
  let environment = window.location.host;
  if (__API_HOST__) {
    const url = new URL(__API_HOST__);
    environment = url.host;
  }
  rollbar = new Rollbar({
      accessToken: __ROLLBAR_POST_CLIENT_TOKEN__,
      captureUncaught: true,
      captureUnhandledRejections: true,
      payload: {
          environment,
          client: {
            javascript: {
              /* eslint-disable camelcase */
              code_version: __VERSION_SHA__,
              guess_uncaught_frames: true
              /* eslint-enable camelcase */
            }
          },
          server: {
            root: 'webpack:///./'
          }
      },
      // to deal with URI's as local filesystem paths, we use the "many domain" transform:
      // https://rollbar.com/docs/source-maps/#using-source-maps-on-many-domains
      transform: function(payload) {
        var trace = payload.body.trace;
        var locRegex = /^(https?):\/\/[a-zA-Z0-9._-]+\.tidepool\.org(.*)/;
        if (trace && trace.frames) {
          for (var i = 0; i < trace.frames.length; i++) {
            var filename = trace.frames[i].filename;
            if (filename) {
              var m = filename.match(locRegex);
              // Be sure that the minified_url when uploading includes 'dynamichost'
              trace.frames[i].filename = m[1] + '://dynamichost' + m[2];
            }
          }
        }
      }
    }
  );
}

export default rollbar;
