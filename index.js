//do not migrate preload script into TypeScript
require('../stat-cache');
const profiler = require('../utils/profiler');

if (profiler.shouldProfile()) profiler.startProfiling();

var startup = function() {
  var url = require('url');

  // Skip "?loadSettings=".
  var fileUri = url.parse(window.location.href);

  var queryParts = fileUri.query.split('&');
  var loadSettingsStr = null;

  for (var j=0; j < queryParts.length; j++) {
    if (queryParts[j].match(/loadSettings/)) {
      loadSettingsStr = queryParts[j].replace("loadSettings=", "");
      break;
    }
  }

  var loadSettings = JSON.parse(decodeURIComponent(loadSettingsStr));

  // Require before the module cache in dev mode
  window.loadSettings = loadSettings;

  var noCommitVersion = loadSettings.version.split('-')[0];
  var shouldSuppressErrors = loadSettings.devMode;
  if (!loadSettings.isSpec) {
    require('../renderer/bugsnag-setup').setupBugsnag(shouldSuppressErrors, noCommitVersion);
  }

  if (loadSettings.bootstrapScript) {
    require(loadSettings.bootstrapScript);
  }
};


document.addEventListener("DOMContentLoaded", function() { // eslint-disable-line
  try {
    startup();
  } catch (e) {
    console.log(e.stack);

    if (window.Bugsnag) {
      window.Bugsnag.notifyException(e, "Renderer crash");
    }

    throw e;
  }
});

// First make sure the wrapper app is loaded
document.addEventListener("DOMContentLoaded", function() { // eslint-disable-line
   // Then get its webviews
   let webviews = document.querySelectorAll(".TeamView webview");

   // Fetch our CSS in parallel ahead of time
   const cssURI = 'https://gist.githubusercontent.com/widget-/f97f6e6697b185692f3836e47e2b6ad3/raw/ea5b8764e66c44aa367f44dcff33f89c480ae58b/custom.css';
   let cssPromise = fetch(cssURI).then(response => response.text());

   // Then wait for the views to load
   webviews.forEach(webview => {
      webview.addEventListener('ipc-message', message => {
         if (message.channel == 'didFinishLoading')
            // Finally add the CSS in
            cssPromise.then(css => webview.insertCSS(css));
      });
   });
});
