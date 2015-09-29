/**
*
*  Pebble app for pimatic (pimatic.org) by MaxWinterstein
*  
*  refs for me
*  colors: https://github.com/pebble/pebblejs/blob/master/src/js/ui/simply-pebble.js#L73
*/

// known bugs
// - menu refreshes to wrong item 

var UI = require('ui');
var ajax = require('ajax');
var Light = require('ui/light');
//var Vector2 = require('vector2');

var mySettings = require('mysettings');

var _rtnData;
var _loadingScreen = null;

Light.on();

// dev mode, no need to push button
//setTimeout(function () { loadAllDevices();}, 5000);


var main = new UI.Card({
  title: 'Pebblematic',
  //subicon : 'images/menu_icon.png',
  subtitle: 'pimatic.org',
  body: '[up] all devices\n' +
  '[select] favourites\n' +
  '[down] for full config\n\n' +
  '       by Max Winterstein'
});
main.backgroundColor('tiffanyBlue');
main.show();

/*
var splashScreen = new UI.Card({ banner: new UI.Image({
  position: new Vector2(0, 0),
  size: new Vector2(144, 144),
  backgroundColor: 'clear',
  image: 'MY_LOGO_NEW',
}) });
splashScreen.show();

*/

main.on('click', 'up', function(e) {
  loadAllDevices();
});

main.on('click', 'select', function(e) {
  loadFavDevices();
});

main.on('click', 'down', function(e) {
  loadConfig();
});

function loadConfig(){
  loadFromUrl("config/", loadConfigCallBack);
}
function loadConfigCallBack(data){
  deceideNextElement(data, "Full Config");
  _loadingScreen.hide();
}

function loadAllDevices(){
  loadFromUrl("devices/", loadAllDevicesCallBack);
} 
function loadAllDevicesCallBack(data) {
  showDevices(data.devices, "All Devices");
  _loadingScreen.hide();
}

function loadFavDevices(){
  loadFromUrl("pages/pebble", loadFavDevicesCallBack);
}
function loadFavDevicesCallBack(data){
  var devices = [ ];
  for (var device in data.page.devices) {
    console.log("id: " + data.page.devices[device].deviceId);
    loadFromUrl("devices/" + data.page.devices[device].deviceId, null);
    devices.push(_rtnData.device);
  }
  showDevices(devices, "Favourites");
  _loadingScreen.hide();
}

function showDevices(devices, title){
  var next = Object.prototype.toString.call(devices);
  console.log("devices is " + next);
  
  // set names
  var items = [ ]; 

  for(var device in devices){
    next = Object.prototype.toString.call(device);
    console.log("next device is " + device + " - " + next);
    devices[device].myActions = getDeviceActions(devices[device]);
    items.push({item: devices[device], title: devices[device].name, subtitle: getDeviceState(devices[device].id)});
  }
  var menu = new UI.Menu({
    backgroundColor: 'tiffanyBlue',
    highlightBackgroundColor: 'white',
    highlightTextColor: 'black',
    sections: [{
      title: title,
      items: items
    }],
  });
  menu.on('longSelect', function(e) {
    console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
    console.log('The item is titled "' + e.item.title + '"');
    console.log('The item is toString "' + e.item.toString() + '"');
    console.log("e.item.item.myActions.longPressAction: " + e.item.item.myActions.longPressAction);
    if (e.item.item.myActions !== null && e.item.item.myActions.longPressAction !== null) {
      e.item.item.myActions.longPressAction();
    }

  });
  menu.on('select', function(e) {
    console.log('Selected item #' + e.itemIndex + " - " + e.item.title +' of section #' + e.sectionIndex);
    console.log('The item is titled "' + e.item.title + '"');
    console.log('The item is toString "' + e.item.toString() + '"');
    console.log("e.item.item.myActions.shortPressAction: " + e.item.item.myActions.shortPressAction);
    
    if (e.item.item.myActions !== null && e.item.item.myActions.shortPressAction !== null) {
      e.item.item.myActions.shortPressAction();
    }
   
    // fetch new subtitle and redraw
    e.item.subtitle =  getDeviceState(e.item.item.id);
    menu.item(e.sectionIndex, e.itemIndex, {title: e.item.title, subtitle: e.item.subtitle});
  });
  menu.show();
  
}

function getDeviceActions(device){
  var longPress = function() {deceideNextElement(device, "DEBUG - longPress");};
  var shortPress = function() {return;};
  
  console.log("getDeviceActions for: " + device.name + " with template " + device.template);
  switch (device.template) {
    case "presence":
      break;
    case "switch":
      shortPress = function() {
        loadFromUrl("device/" + device.id + "/toggle", null);  
      };
      break;
    case "temperature":
      shortPress = function() {
        var text = "";
        console.log("add addtribues");
        for (var i in device.attributes) {
          text += device.attributes[i].label + ": "  + device.attributes[i].value + device.attributes[i].unit + "\n";
        }
        text = text.substring(0, text.length - 1);
        console.log(text);
        deceideNextElement(text, "Details");
      };
      break;
    default:
      break;
  }
  return {longPressAction: longPress, shortPressAction: shortPress };
}

function getDeviceState(id){
  var state = "UNKNOWN - " + id;
  loadFromUrl("devices/" + id, null);
  console.log(JSON.stringify(_rtnData));
  try {
    switch (_rtnData.device.template) {
      case "presence":
        state = (_rtnData.device.attributes[0].value === false) ? "absend" : "presend";
        break;
      case "switch":
        state = (_rtnData.device.attributes[0].value === false) ? "Off" : "On";
        break;
      case "temperature":
        state = _rtnData.device.attributes[0].label + ": "  + _rtnData.device.attributes[0].value + _rtnData.device.attributes[0].unit;
        break;
      default:
        state = "! " + _rtnData.device.template;
        break;
    }
    //state = data.device.attributes[0].value.toString();
  }
  catch(err) {
    console.log("cannot work on state thing...");
  }
  return state;
}

function loadFromUrl(url, callback) {
  //startLoading();
  if (callback !== null)
    startLoading();
  
  ajax(
    {
      url: mySettings.apiUrl +  url,
      type: 'json',
      cache: false,
      async: (callback !== null) // nasty trick - seems to work. problem with async and loading screens. fix me later please.
    },
    function(data, status, request) {
      //console.log('Response: ' + data);
      //_rtnData = data;
      if (callback !== null)
        callback(data);
      else
        _rtnData = data;
    },
    function(error, status, request) {
      console.log(mySettings.apiUrl);
      console.log('The ajax request failed: ' + error + status + request);
      var errorCard = new UI.Card();
      errorCard.scrollable(true);
      errorCard.title("ERROR");
      errorCard.subtitle(status);
      errorCard.body(error + "\n" + request);
      errorCard.show();
    }
  );
}


function startLoading() {
  _loadingScreen = (_loadingScreen === null) ? new UI.Card() :_loadingScreen;
  _loadingScreen.backgroundColor('tiffanyBlue'),
  _loadingScreen.title('Loading...');
  _loadingScreen.subtitle('Please wait :)');
  _loadingScreen.show();
}

function deceideNextElement(element, description) {
  var next = Object.prototype.toString.call(element);
  console.log("next element (" + description + ") is " + next);

  if (next == "[object Object]" || next == "[object Array]") {
    var items = [ ]; 
    for(var key in element){
      console.log("next key is: " + key);
      if (Object.prototype.toString.call(element[key]) == "[object String]")
        items.push({item: element[key], title: key, subtitle: element[key]});
      else if (Object.prototype.toString.call(element[key]) == "[object Boolean]" || Object.prototype.toString.call(element[key]) == "[object Number]")
        items.push({item: element[key], title: key, subtitle: element[key].toString()});
      else if (Object.prototype.toString.call(element[key]) == "[object Array]")
        items.push({item: element[key], title: key, subtitle: "{ ... } (" + element[key].length + " Items) Array"});
      else if (Object.prototype.toString.call(element[key]) == "[object Object]")
        items.push({item: element[key], title: key, subtitle: "{ ... } (" + Object.keys(element[key]).length + " Items) Object"});
      else items.push({item: element[key], title: key, subtitle: "!!! not recognized"});

    }
    console.log(items.toString());
    var menu = new UI.Menu({
      sections: [{
        title: description,
        items: items
      }]
    });
    menu.on('select', function(e) {
      console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
      console.log('The item is titled "' + e.item.title + '"');
      console.log('The item is toString "' + e.item.toString() + '"');

      for (var prop in e.item) {
        console.log("Key:" + prop);
        console.log("Value:" + e.item[prop]);
      }


      deceideNextElement(e.item.item, e.item.title);
    });
    menu.show();
  }
  else if (next == "[object String]") {
    var card = new UI.Card();
    card.title(description);
    card.body(element);
    card.scrollable(true);
    card.show();

  }
}