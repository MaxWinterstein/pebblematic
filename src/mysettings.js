var Settings = require('settings');

// Set a configurable with the open callback
Settings.config(
  { url: 'http://maxwinterstein.github.io/pebblematic/config.html' },
  function(e) {
    console.log('opening configurable');
    // Reset color to red before opening the webview
  },
  function(e) {
    console.log('closed configurable');
    
    // Show the parsed response
    console.log(JSON.stringify(e.options));
    
    // save 
    Settings.option(e.options);
    
    // display in log
    console.log("api-url: " + Settings.option('api-url'));

    
    if (e.failed) {
      // Show the raw response if parsing failed
      console.log(e.response);
    }
  }
);

module.exports = { apiUrl: Settings.option('api-url')};