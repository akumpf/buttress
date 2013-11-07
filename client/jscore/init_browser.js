
// POLYFILL FOR BROWSER STILL IN FLUX.
(function() {
  var DEBUG     = false;
  var lastTime  = 0;
  var vendors   = ['', 'ms', 'moz', 'webkit', 'o'];
  var winProps  = [
    "requestFileSystem",
    "storageInfo",
    "resolveLocalFileSystemURL",
    // --
    "requestAnimationFrame",
    "cancelAnimationFrame",
    // --
    "OfflineAudioContext",
    "AudioContext",
    // --
    "RTCPeerConnection",
    "RTCIceCandidate",
    "RTCPeerConnection",
    "RTCSessionDescription",
    // --
    "notifications",
    // --
    "URL"
  ];
  var navProps  = [
    "getUserMedia",
    "temporaryStorage",
    "persistentStorage"
  ];
  var docProps  = [
    "visibilityState",
  ]; 
  // --
  if(!navigator) window.navigator = {};
  if(!console)   window.console   = {
    log:    function(){},
    warn:   function(){},
    error:  function(){}
  };
  var vendor = "";
  // --
  for(var x=0; x < vendors.length; x++) {
    for(var y=0; y < winProps.length; y++) {
      var prop  = winProps[y];
      var propB = prop.charAt(0).toUpperCase() + prop.substring(1);
      if(window[prop] === undefined){
        window[prop] = window[vendors[x]+propB];
        if(window[prop]){
          vendor = vendors[x];
          if(DEBUG) console.log("POLYFILL(window):", prop+" --> "+vendors[x]+propB);
        }
      }
    }
    for(var y=0; y < navProps.length; y++) {
      var prop  = navProps[y];
      var propB = prop.charAt(0).toUpperCase() + prop.substring(1);
      if(navigator[prop] === undefined){
        navigator[prop] = navigator[vendors[x]+propB];
        if(navigator[prop]){
          vendor = vendors[x];
          if(DEBUG) console.log("POLYFILL(navigator):", prop+" --> "+vendors[x]+propB);
        }
      }
    }
    for(var y=0; y < docProps.length; y++) {
      var prop  = docProps[y];
      var propB = prop.charAt(0).toUpperCase() + prop.substring(1);
      if(document[prop] === undefined){
        document[prop] = document[vendors[x]+propB];
        if(document[prop]){
          vendor = vendors[x];
          if(DEBUG) console.log("POLYFILL(document):", prop+" --> "+vendors[x]+propB);
        }
      }
    }
  }
  window.vendorPrefix = vendor;
  // FALLBACKS...
  //* 
  if(!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {clearTimeout(id);};
  // -- 
  document.getVisibilityState = function(){
    var prop  = "visibilityState";
    var propB = prop.charAt(0).toUpperCase() + prop.substring(1);
    var v = "visible";
    for(var x=0; x < vendors.length; x++) {
      if(document[vendors[x]+propB]){
        v = document[vendors[x]+propB];
      }
    }
    return v;
  };
  document.onvisibilitychange = function(cb){
    for(var i=0; i<vendors.length; i++){
      $(document).on(vendors[i]+"visibilitychange", cb);
    }
  };
  // --
  if(!navigator.temporaryStorage && window.storageInfo){
    console.warn("SHIM: storageInfo -> temporaryStorage");
    navigator.temporaryStorage = {};
    navigator.temporaryStorage.queryUsageAndQuota = function(success, error){
      window.storageInfo.queryUsageAndQuota("TEMPORARY", success, error); 
    }
  }
  //  */
}());
// --
window.isMobile   = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|mobile)/); 
window.isInIFrame = (window.location != window.parent.location) ? true : false;
window.myRand     = window.myRand ||Math.random().toString(32).substring(2);
window.getUUID    = window.getUUID||function(){
  return (new Date().getTime().toString(36))+"_"+myRand+"_"+Math.random().toString(32).substring(2); 
};
window.getWindowName  = function(){
  var n = window.name||"";
  if(!n || n.length < 1){
    n = getUUID();
    window.name = n;
  }
  return n;
};
window.changeCSS      = function(myclass,element,value) {
  var CSSRules;
  if (document.all) {
    CSSRules = 'rules';
  }
  else if (document.getElementById) {
    CSSRules = 'cssRules';
  }
  var foundMatch = false;
  var s = 0;
  if(!document.styleSheets) return console.warn("no document.styleSheets");
  for(s=0; s<document.styleSheets.length; s++){
    if(!document.styleSheets[s][CSSRules]){
      //console.warn("no inner styleSheet rule.", CSSRules, document.styleSheets[s]); 
      continue;
    }
    for (var i = 0; i < document.styleSheets[s][CSSRules].length; i++) {
      if (document.styleSheets[s][CSSRules][i].selectorText == myclass) {
        document.styleSheets[s][CSSRules][i].style[element] = value;
        foundMatch = true;
      }
    }  
  }
  if(!foundMatch){
    s = document.styleSheets.length-1;
    var newStyle = myclass+" { "+element+": "+value+";}";
    if(!document.styleSheets[s][CSSRules]) return console.warn("no inner stylesheet rule 2."); 
    document.styleSheets[s].insertRule(newStyle, document.styleSheets[s][CSSRules].length);   
    //console.log("inserting rule: ", myclass, element, value, newStyle);
  }
};
window.escapeHTML     = function(msg){
  return (msg||"").replace(/\&/g, "&amp;").replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
};
window.logErrCB       = function(err,cb){
  console.error(err);
  if(!cb) return console.warn("no callback in logErrCB. You should change that.");
  cb(err);
};
window.appReady       = function(){
  $(".showif_notready").hide();
  $(".showif_ready").show();
};
// --
window.settings       = window.settings||{};
// --
// basic jquery addons; if this gets large, we can break it out separately.
$.fn.dontScrollParent = function(exceptions){
  this.bind('mousewheel DOMMouseScroll',function(e){
    var me = this;
    if(exceptions){
      if($(e.target).parents(exceptions).length > 0){
        console.log("a parent was an exception.");
        me = $(e.target).parents(exceptions).get(0);
        //return true;
      }
      if($(e.target).parent().children(exceptions).length > 0){
        console.log("self or sibling was exception.");
        me = $(e.target).parent().children(exceptions).get(0);
        //return true;
      }
    }
    var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
    if (delta > 0 && $(me).scrollTop() <= 0)
      return false;
    if (delta < 0 && $(me).scrollTop() >= me.scrollHeight - $(me).innerHeight())
      return false;
    return true;
  });
};
// --

// jQuery addTouch
// see: http://www.jquery4u.com/plugins/10-jquery-ipad-code-snippets-plugins/
$.fn.addTouch = function(){
  this.each(function(i,el){
    $(el).bind('touchstart touchmove touchend touchcancel',function(){
      //we pass the original event object because the jQuery event
      //object is normalized to w3c specs and does not provide the TouchList
      handleTouch(event);
    });
  });
 
  var handleTouch = function(event)
  {
    var touches = event.changedTouches,
            first = touches[0],
            type = '';
 
    switch(event.type)
    {
      case 'touchstart':
        type = 'mousedown';
        break;
 
      case 'touchmove':
        type = 'mousemove';
        event.preventDefault();
        break;
 
      case 'touchend':
        type = 'mouseup';
        break;
 
      default:
        return;
    }
 
    var simulatedEvent = document.createEvent('MouseEvent');
    simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0/*left*/, null);
    first.target.dispatchEvent(simulatedEvent);
  };
};

// Screenfull (MIT License)
// https://github.com/sindresorhus/screenfull.js
(function (window, document) {
  'use strict';
  var keyboardAllowed = typeof Element !== 'undefined' && 'ALLOW_KEYBOARD_INPUT' in Element; // IE6 throws without typeof check
  var fn = (function () {
      var val, valLength;
      var fnMap = [
        [
          'requestFullscreen',
          'exitFullscreen',
          'fullscreenElement',
          'fullscreenEnabled',
          'fullscreenchange',
          'fullscreenerror'
        ],
        // new WebKit
        [
          'webkitRequestFullscreen',
          'webkitExitFullscreen',
          'webkitFullscreenElement',
          'webkitFullscreenEnabled',
          'webkitfullscreenchange',
          'webkitfullscreenerror'

        ],
        // old WebKit (Safari 5.1)
        [
          'webkitRequestFullScreen',
          'webkitCancelFullScreen',
          'webkitCurrentFullScreenElement',
          'webkitCancelFullScreen',
          'webkitfullscreenchange',
          'webkitfullscreenerror'

        ],
        [
          'mozRequestFullScreen',
          'mozCancelFullScreen',
          'mozFullScreenElement',
          'mozFullScreenEnabled',
          'mozfullscreenchange',
          'mozfullscreenerror'
        ],
        [
          'msRequestFullscreen',
          'msExitFullscreen',
          'msFullscreenElement',
          'msFullscreenEnabled',
          'MSFullscreenchange',
          'MSFullscreenerror'
        ]
      ];
      var i = 0;
      var l = fnMap.length;
      var ret = {};
      for (; i < l; i++) {
        val = fnMap[i];
        if (val && val[1] in document) {
          for (i = 0, valLength = val.length; i < valLength; i++) {
            ret[fnMap[0][i]] = val[i];
          }
          return ret;
        }
      }
      return false;
    })();
  var screenfull = {
      request: function (elem) {
        var request = fn.requestFullscreen;
        elem = elem || document.documentElement;
        // Work around Safari 5.1 bug: reports support for
        // keyboard in fullscreen even though it doesn't.
        // Browser sniffing, since the alternative with
        // setTimeout is even worse.
        if (/5\.1[\.\d]* Safari/.test(navigator.userAgent)) {
          elem[request]();
        } else {
          elem[request](keyboardAllowed && Element.ALLOW_KEYBOARD_INPUT);
        }
      },
      exit: function () {
        document[fn.exitFullscreen]();
      },
      toggle: function (elem) {
        if (this.isFullscreen) {
          this.exit();
        } else {
          this.request(elem);
        }
      },
      onchange: function () {},
      onerror: function () {},
      raw: fn
    };
  if (!fn) {
    window.screenfull = false;
    return;
  }
  Object.defineProperties(screenfull, {
    isFullscreen: {
      get: function () {
        return !!document[fn.fullscreenElement];
      }
    },
    element: {
      enumerable: true,
      get: function () {
        return document[fn.fullscreenElement];
      }
    },
    enabled: {
      enumerable: true,
      get: function () { // Coerce to boolean in case of old WebKit
        return !!document[fn.fullscreenEnabled];
      }
    }
  });
  document.addEventListener(fn.fullscreenchange, function (e) {
    screenfull.onchange.call(screenfull, e);
  });
  document.addEventListener(fn.fullscreenerror, function (e) {
    screenfull.onerror.call(screenfull, e);
  });
  window.screenfull = screenfull;
})(window, document);
