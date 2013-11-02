//
// TEQ (Timed Event Queue)
//

define([],
function(){
  var exports = {};
  var teq     = exports; 
  window.teq  = teq; // for debugging
  // --------
  // Super handy ordered/timed event queue.
  // questions? akumpf
  // --
  // Create a new event queue like so:
  //   var myTEQ = new teq();
  // An example event looks like this: 
  //   {id: anythingyouwant, t: atimestamp, anythingelse:...}
  // Add events via:    myTEQ.addOrUpdateEvent(event);
  // Remove events via: myTEQ.removeEvent(event._id);
  // When there is a jump in time, move the pointer like so:
  //   myTEQ.jumpPointerToTime(newStartTime);
  // In an event consuming loop (like an event player), call:
  //   var eventsToPlay = myTEQ.gotoTimeGetEvents(endTime);
  // There are also common utils, like clearing:
  //   myTEQ.clear();
  // Note that events without time (no "t") are considered as timeless-state.
  // -------- 
  function TimedEventQueue(){
    this.eventsByID         = {};
    this.eventsByTime       = [];
    this.eventQueuePtr      = 0;
    this.currentChanState   = {};
    this.tempIgnoredEvents  = {};
    this.timelessState      = {}; // events without time = state.
    // --
    this.addOrUpdateEvent   = function(e){
      if(!e || e._id === undefined){
        return console.warn("Can't add event without id", e);
      }
      if(e.t === undefined){
        this.timelessState[e._id] = e;
        if(this.onAddOrChangeFn) this.onAddOrChangeFn(e);
        return;
      }
      if(this.eventsByID[e._id]){
        this.removeEventByID(e._id);
      }
      this.addEvent(e);
    };
    this.addEvent           = function(e){
      if(!e || e._id === undefined){
        return console.warn("Can't add event without id and time", e);
      }
      if(e.t === undefined){
        this.timelessState[e._id] = e;
        if(this.onAddOrChangeFn) this.onAddOrChangeFn(e);
        return;
      }
      if(this.eventsByID[e._id]){
        return console.warn("Can't update in addEvent. use addOrUpdateEvent instead.");
      }else{
        e._ = e._||{};
        if(this.chanTypeFn) e._.chanType = this.chanTypeFn(e);
        this.eventsByID[e._id] = e;
        var added = false;
        for(var i=0; i<this.eventsByTime.length; i++){
          if(this.eventsByTime[i].t > e.t){
            this.eventsByTime.splice(i, 0, e);
            if(i < this.eventQueuePtr) this.eventQueuePtr++;
            if(e._.chanType){
              e._.nextInChan = null;
              e._.prevInChan = null;
              // set this nextInChan -- looking forward
              for(var j=i+1; j<this.eventsByTime.length; j++){
                if(e._.chanType === this.eventsByTime[j]._.chanType){
                  e._.nextInChan = this.eventsByTime[j];
                  this.eventsByTime[j]._.prevInChan = e;
                  break;
                }
              }
              // set prev nextInChan -- looking backward
              for(var j=i-1; j>=0; j--){
                if(e._.chanType === this.eventsByTime[j]._.chanType){
                  this.eventsByTime[j]._.nextInChan = e;
                  e._.prevInChan = this.eventsByTime[j];
                  break;
                }
              }
            }
            added = true;
            break;
          }
        }
        if(!added){
          this.eventsByTime.push(e);
          if(e._.chanType){
            e._.nextInChan = null;
            e._.prevInChan = null; 
            // set prev nextInChan -- looking backward
            for(var j=this.eventsByTime.length-2; j>=0; j--){
              if(e._.chanType === this.eventsByTime[j]._.chanType){
                this.eventsByTime[j]._.nextInChan = e;
                e._.prevInChan = this.eventsByTime[j];
                break;
              }
            }
          }
        }
        if(this.onAddOrChangeFn) this.onAddOrChangeFn(e);
        return;
      }
    };
    this.removeEventByID    = function(id){
      if(this.timelessState[id]){
        var oldTE = this.timelessState[id];
        delete this.timelessState[id];
        if(this.onRemoveFn) this.onRemoveFn(oldTE);
        return;
      }
      if(!this.eventsByID[id]) return console.warn("Trying to delete non-existant event.");
      delete this.eventsByID[id];
      for(var i=0; i<this.eventsByTime.length; i++){
        if(this.eventsByTime[i]._id === id){
          var oldE = this.eventsByTime.splice(i,1);
          if(i < this.eventQueuePtr) this.eventQueuePtr--;
          // update next/prev links...
          if(oldE._ && oldE._.chanType){
            if(oldE._.nextInChan){
              oldE._.nextInChan._.prevInChan = oldE._.prevInChan;
            }
            if(oldE._.prevInChan){
              oldE._.prevInChan._.nextInChan = oldE._.nextInChan;
            }
          } 
          if(this.onRemoveFn) this.onRemoveFn(oldE);
          break;
        } 
      }
    };
    this.jumpPointerToTime  = function(time){
      var ptr = this.eventsByTime.length;
      var newCurrentChanStat = {};
      this.tempIgnoredEvents = {}; // clear out ignored events on jump.
      for(var i=0; i<this.eventsByTime.length; i++){
        var e = this.eventsByTime[i];
        if(e.t >= time){
          ptr = i;
          break;
        } 
        if(e._ && e._.chanType){
          newCurrentChanStat[e._.chanType] = e;
        } 
      }
      this.currentChanState = newCurrentChanStat;
      this.eventQueuePtr = ptr;
    };
    this.gotoTimeGetEvents  = function(time){
      var es = [];
      for(var i=this.eventQueuePtr; i<this.eventsByTime.length; i++){
        var e = this.eventsByTime[i];
        if(e.t <= time){
          if(!this.tempIgnoredEvents[e._id]){
            es.push(e);
            if(e._ && e._.chanType){
              this.currentChanState[e._.chanType] = e;
            }
          }else{
            console.log("Ignored teq event (likely old):", e); 
          } 
          this.eventQueuePtr++;
        }else{
          break;
        }
      }
      return es;
    };
    this.clear              = function(){
      //console.log("Clearing out TimedEventQueue.");
      this.eventsByID         = {};
      this.eventsByTime       = [];
      this.eventQueuePtr      = 0;
      this.timelessState      = {};
      return;
    };
    // --
    this.chanTypeFn         = null;
    this.setChanTypeFn      = function(cb){
      this.chanTypeFn = cb;
    };
    this.onAddOrChangeFn    = null;
    this.setAddChangeFn     = function(cb){
      this.onAddOrChangeFn = cb;
    };
    this.onRemoveFn         = null;
    this.setRemoveFn        = function(cb){
      this.onRemoveFn = cb;
    };
  } 
  // --
  window.teq  = TimedEventQueue; // for debugging
  return TimedEventQueue;
});
