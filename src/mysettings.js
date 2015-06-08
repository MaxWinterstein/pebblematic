var Settings = require('settings');

// Set a configurable with the open callback
Settings.config(
  { url: 'http://maxwinterstein.github.io/pebblematic/config.html' },
  function(e) {
    console.log('opening configurable');

    // Reset color to red before opening the webview
    Settings.option('color', 'red');
  },
  function(e) {
    console.log('closed configurable');
        // Show the parsed response
    console.log(JSON.stringify(e.options));
Settings.option(e.options);
    console.log("api-url: " + Settings.option('api-url'));
    // Show the raw response if parsing failed
    if (e.failed) {
      console.log(e.response);
    }
  }
);