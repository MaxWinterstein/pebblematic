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

var mySettings = require('mysettings');

var _rtnData;
var _loadingScreen = null;

Light.on();

var main = new UI.Card({
  title: 'Pebblematic',
  subicon : 'images/menu_icon.png',
  //subtitle: 'Pebble meets pimatic',
  body: '\n[up] all devices\n' +
  '[select] favourites\n' +
  '[down] for full config\n\n' +
  '       by Max Winterstein'
});
main.backgroundColor('tiffanyBlue');
main.show();


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
function loadConfigCallBack(){
  deceideNextElement(_rtnData, "Full Config");
  _loadingScreen.hide();
}

function loadAllDevices(){
  loadFromUrl("devices/", loadAllDevicesCallBack);
} 
function loadAllDevicesCallBack() {
  showDevices(_rtnData.devices, "All Devices");
  _loadingScreen.hide();
}

function loadFavDevices(){
  loadFromUrl("pages/pebble", loadFavDevicesCallBack);
  _loadingScreen.hide();
}
function loadFavDevicesCallBack(){
  deceideNextElement(_rtnData.page.devices, "Favourites");
}

function showDevices(devices){
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
    sections: [{
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
  menu.on('longSelect', function(e) {
    console.log('Selected item #' + e.itemIndex + " - " + e.item.title +' of section #' + e.sectionIndex);
    console.log("e.item.item.myActions.longPressAction: " + e.item.item.myActions.longPressAction);
    if (e.item.item.myActions !== null) e.item.item.myActions.longPressAction();
    e.item.subtitle =  getDeviceState(e.item.item.id);
    _loadingScreen.hide();
    console.log("e.keys" + Object.keys(e).toString());
    //e.selection(e.item);
    //e.item.subtitle =  Date.now();
  });
  menu.show();
  
}

function getDeviceActions(device){
  var longPress = "not set";
  console.log("getDeviceActions for: " + device.name + " with template " + device.template);
  switch (device.template) {
    case "presence":
      //       state = (device.attributes[0].value === false) ? "absend" : "presend";
      break;
    case "switch":
      longPress = function() {
        loadFromUrl("device/" + device.id + "/toggle", null);  
      };
      break;
    default:
      //   state = "! " + device.template;
      break;
  }
  return {longPressAction: longPress };
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
      default:
        state = "! " + _rtnData.device.template;
        break;
    }
    //state = _rtnData.device.attributes[0].value.toString();
  }
  catch(err) {
    console.log("cannot work on state thing...");
  }
  return state;
}

function loadFromUrl(url, callback) {
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
      _rtnData = data;
      if (callback !== null) callback();
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
  _loadingScreen.title('Loading...');
  _loadingScreen.subtitle('Please wait :)');
  _loadingScreen.show();
}

function deceideNextElement(element, description) {
  var next = Object.prototype.toString.call(element);
  console.log("next element is " + next);

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