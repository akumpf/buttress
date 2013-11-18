// --
// jQuery fast mouse/touch updn merger! 
// --
// Make mouse events and touch events play well together in 
// rich fullscreen apps on desktop, tablet, and phone :)
// --
//
// Note 1: this is intended for responsive fullscreen webapps; 
//         it'll mess with defaults (like scrolling)!
// Note 2: use 'pointer-events: none;' in css for child elements you 
//         don't want to be touchable (keeps things super fast). 
// Note 3: This bypasses jQuery for low-level events -- it's speedy! 
//         But that means events are not be normalized by jQuery. Use
//         the $.eventToElEX(event, element) function in your callback 
//         to get the X,Y (and percent X,Y) when needed.
//
// questions? akumpf@gmail.com
// created for Fiddlewax: https://fiddlewax.com
// --
//
// OVERVIEW: 
//
// onDn             (down on element)
// onDnMoveAny      (down on element and moving/dragging anywhere on the screen)
// onDnMoveOver     (donw on element and moving/dragging still over element)
// onDnUpAny        (down on element and up anywhere on the screen)
// onDnUpOver       (down on element and up on same element; users may have left and returned)
// onDragEnter      (down on anywhere else, but dragged over this element)
// onDragOver       (down anywhere (this or elsewhere), and dragging/moving over this element)
// onDragLeaveOrUp  (dragged to this element and is now leaving; or just up/released.)
//
// --
// EXAMPLE USAGE:
/*
   $("#myElement")
    .onDn            (function(e,el){console.log("dn:",            e.id, e)})
    .onDnMoveAny     (function(e,el){console.log("dnMoveAny:",     e.id, $.eventToElXY(e,el))})
    .onDnMoveOver    (function(e,el){console.log("dnMoveOver:",    e.id, e)})
    .onDnUpAny       (function(e,el){console.log("dnUpAny:",       e.id, e)})
    .onDnUpOver      (function(e,el){console.log("dnUpOver:",      e.id, e)})
    .onDragEnter     (function(e,el){console.log("dragEnter:",     e.id, e)})
    .onDragOver      (function(e,el){console.log("dragOver:",      e.id, e)})
    .onDragLeaveOrUp (function(e,el){console.log("dragLeaveOrUp:", e.id, e)});
*/
// --
(function(){
  var dnOrigTarget = {};
  var dnPrevTarget = {};
  // -- TOUCH --
  function onTouchStart(es){
    es.preventDefault();
    var touches = es.changedTouches||es.touches||[];
    for(var i=0; i<touches.length; i++){
      var e = touches[i];
      e.id  = e.id||e.identifier;
      if(e.id === undefined) e.id = -1;
      var t = document.elementFromPoint(e.clientX, e.clientY);
      // --
      dnOrigTarget[e.id] = t; // save the original target for this dn event.
      dnPrevTarget[e.id] = t; // save the previous target for this dn event.
      // --
      if(t.onDn) t.onDn(e,t);
    }
  } 
  function onTouchDrag(es){
    es.preventDefault();
    var touches = es.changedTouches||es.touches||[];
    for(var i=0; i<touches.length; i++) onEventDrag(touches[i], true);
  }
  function onTouchEndDrag(es){
    es.preventDefault();
    var touches = es.changedTouches||es.touches||[];
    for(var i=0; i<touches.length; i++) onEventEndDrag(touches[i], true);
  }
  // -- MOUSE --
  function onMouseDown(e){
    e.preventDefault();
    e.id  = e.id||e.identifier;
    if(e.id === undefined) e.id = -1;
    var t = document.elementFromPoint(e.clientX, e.clientY);
    // --
    dnOrigTarget[e.id] = t; // save the original target for this dn event.
    dnPrevTarget[e.id] = t; // save the previous target for this dn event.
    // --
    if(t.onDn) t.onDn(e,t);
  }
  // -- MOUSE/TOUCH EVENT PROCESSORS --
  function onEventDrag(e){
    if(e.preventDefault) e.preventDefault();
    e.id  = e.id||e.identifier;
    if(e.id === undefined) e.id = -1;
    var t1 = dnOrigTarget[e.id];
    if(!t1) return; // NOT DOWN.
    // --
    var t2 = dnPrevTarget[e.id]||{};
    var t3 = document.elementFromPoint(e.clientX, e.clientY);
    // --
    dnPrevTarget[e.id] = t3; // save the previous target for this dn event.
    // --
    if(t3 === t1 && t1.onDnMoveOver) t1.onDnMoveOver(e,t1);
    if(t1.onDnMoveAny) t1.onDnMoveAny(e,t1);
    if(t3 && t3 !== t2){
      // we moved to a different element (from t2 to t3).
      if(t2 && t2.onDragLeaveOrUp) t2.onDragLeaveOrUp(e,t2);
      if(t3 && t3.onDragEnter) t3.onDragEnter(e,t3);
    }
    if(t3 && t3.onDragOver) t3.onDragOver(e,t3);
  }
  function onEventEndDrag(e){
    if(e.preventDefault) e.preventDefault();
    // --
    e.id  = e.id||e.identifier;
    if(e.id === undefined) e.id = -1;
    var t1 = dnOrigTarget[e.id];
    if(!t1) return; // NOT DOWN.
    // --
    var t2 = dnPrevTarget[e.id]||{};
    var t3 = document.elementFromPoint(e.clientX, e.clientY);
    // --
    delete dnOrigTarget[e.id];
    delete dnPrevTarget[e.id];
    // --
    if(t3 === t1 && t1.onDnUpOver) t1.onDnUpOver(e,t1);
    if(t1.onDnUpAny) t1.onDnUpAny(e,t1);
    if(t3 && t3.onDragLeaveOrUp) t3.onDragLeaveOrUp(e,t3);
  }
  // -- START THE EVENT LISTENING PARTY --
  window.addEventListener("touchstart", onTouchStart,   false);
  window.addEventListener("touchmove",  onTouchDrag,    false);
  window.addEventListener("touchend",   onTouchEndDrag, false);
  window.addEventListener("touchcancel",onTouchEndDrag, false);
  window.addEventListener("mousedown",  onMouseDown,    false);
  window.addEventListener("mousemove",  onEventDrag,    false);
  window.addEventListener("mouseup",    onEventEndDrag, false);
})(); 
$.fn.onDn             = function(fn){this.each(function(i,el){el.onDn             = fn;});return this;};
$.fn.onDnMoveAny      = function(fn){this.each(function(i,el){el.onDnMoveAny      = fn;});return this;};
$.fn.onDnMoveOver     = function(fn){this.each(function(i,el){el.onDnMoveOver     = fn;});return this;};
$.fn.onDnUpAny        = function(fn){this.each(function(i,el){el.onDnUpAny        = fn;});return this;};
$.fn.onDnUpOver       = function(fn){this.each(function(i,el){el.onDnUpOver       = fn;});return this;};
$.fn.onDragEnter      = function(fn){this.each(function(i,el){el.onDragEnter      = fn;});return this;};
$.fn.onDragOver       = function(fn){this.each(function(i,el){el.onDragOver       = fn;});return this;};
$.fn.onDragLeaveOrUp  = function(fn){this.each(function(i,el){el.onDragLeaveOrUp  = fn;});return this;};
$.eventToElXY         = function(e, el){
  var o  = $(el).offset();
  var w  = $(el).width() ||1;
  var h  = $(el).height()||1;
  var relX  = e.pageX - o.left;
  var relY  = e.pageY - o.top;
  return {
    x:  relX, 
    y:  relY, 
    px: Math.max(0, Math.min(1.0, relX / w)),
    py: Math.max(0, Math.min(1.0, relY / h))
  };
};

