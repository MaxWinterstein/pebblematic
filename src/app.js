/**
*
*  Pebble app for pimatic (pimatic.org) by MaxWinterstein
*  
*
*/

var UI = require('ui');
//var Vector2 = require('vector2');
var ajax = require('ajax');
var Light = require('ui/light');
var Settings = require('settings');

require('mysettings');
var _apiUrl = Settings.option('api-url');

Light.on();




var main = new UI.Card({
  title: 'Pebble & pimatic',
  icon: 'images/menu_icon.png',
  //subtitle: 'by Max Winterstein',
  body: '[select] for devices\n' +
        '[down] for full config\n' +
        '[up] to show api-url\n' +
        '     by Max Winterstein'
});
main.show();


main.on('click', 'up', function(e) {
  var menu = new UI.Menu({
    sections: [{
      items: [{
        title: 'Pebble.js',
        icon: 'images/menu_icon.png',
        subtitle: 'Can do Menus'
      }, {
        title: 'Second Item',
        subtitle: 'Subtitle Text'
      }]
    }]
  });
  menu.on('select', function(e) {
    console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
    console.log('The item is titled "' + e.item.title + '"');
  });
  menu.show();
});

main.on('click', 'select', function(e) {
  loadDevices();
});

main.on('click', 'down', function(e) {
  loadConfig();
});

function loadDevices() {
  var card = startLoading();
    ajax(
    {
      url: _apiUrl +  "devices/",
      type: 'json' 
    },
    function(data, status, request) {
      //console.log('Response: ' + data);
      card.hide();
      deceideNextElement(data.devices, "/api/");
    },
    function(error, status, request) {
      console.log('The ajax request failed: ' + error);
      card.scrollable(true);
      card.title("ERROR");
      card.subtitle(status);
      card.body(error + "\n" + request);
    }
  );

}

function loadConfig() {
  var card = startLoading();
  
  ajax(
    {
      url: _apiUrl +  "config/",
      type: 'json' 
    },
    function(data, status, request) {
      //console.log('Response: ' + data);
      card.hide();
      deceideNextElement(data, "/api/");
    },
    function(error, status, request) {
      console.log('The ajax request failed: ' + error);
      card.scrollable(true);
      card.title("ERROR");
      card.body(error);
    }
  );
}

function startLoading() {
  var card = new UI.Card();
  card.title('Loading...');
  card.subtitle('Please wait :)');
  card.show();
  return card;
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
      else if (Object.prototype.toString.call(element[key]) == "[object Object]")
        items.push({item: element[key], title: key, subtitle: "{ ... }"});
      else items.push({item: element[key], title: key});

    }
    console.log(items.toString());
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