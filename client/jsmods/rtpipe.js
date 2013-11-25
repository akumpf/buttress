define(["./sockjs"],function(sockjs){
window.rtpipe = (function(){
  var pipeUsed = false;
  return function(options){  
    if(pipeUsed){
      console.error("rt| pipe already used.");
      return false;
    }
    pipeUsed = true;
    var sockMisconnects      = 0;
    var lastConnectionEnded  = 0;
    var rtpipe               = {};
    rtpipe.CLIENT_ID         = "c_"+(new Date()).getTime().toString(32)+Math.random().toString(32);
    rtpipe.conn              = null;
    var sockjs               = null;
    function _rtpipe_connect(){
      sockjs = new SockJS("/rtp");
      rtpipe.conn = sockjs;
      sockjs.syncd = false;
      function finishOnOpen(sockjs){
        if(options.syncClocks){
          sockjs.serverTimeLag  = -1;
          var reqTime = new Date().getTime();
          rtpipe.serverFn("_getTime", {}, function(t){
            if(t){
              var newDiff = (new Date().getTime()) - t;
              var stl     = (new Date().getTime()) - reqTime;
              sockjs.serverTimeLag  = stl;     // rountrip ping time to server and back
              sockjs.serverTimeDiff = newDiff; // difference between local and server clock
            }
            rtpipe.getSyncTime = function(){ 
              return Math.round((new Date().getTime()) - sockjs.serverTimeDiff + sockjs.serverTimeLag/2.0);
            }; 
            console.log("rt| clocks syncd (via ping)"); 
            rtpipe.onready(sockjs); 
          });
        }else{
          rtpipe.onready(sockjs); 
        }
      }
      sockjs.onopen    = function(){
        if(options.syncSession){ 
          $.get("/rt/getSessionToken", {r: Math.random()}, function(data, ok, getObj){
            if(data && data !== "0"){
              if(window.XMLDocument && data instanceof window.XMLDocument){  
                console.log("warning.. seeing response as XMLDocument.");
                if(getObj) data = getObj.responseText;
              }
              rtpipe.serverFn("_syncSessionViaToken", {token: data}, function(err, args){
                if(err) return console.log(err, data, data2, data3);
                console.log("rt| session sync'd (via "+rtpipe.conn.protocol+")");
                sockjs.syncd = true;
                return finishOnOpen(sockjs);
                //rtpipe.onready(sockjs);
              });
            }else{
              console.log("no session support. is the server setup correctly?");
            }
          });
        }else{
          return finishOnOpen(sockjs);
          //rtpipe.onready(sockjs);
        }
      };
      // received a message. run local function and callback (if they exist)
      var nullFn = function(){};
      sockjs.onmessage = function(e){
        //console.log('[.] message: ', e.data, (new Date()).getTime());
        var msg = e.data;
        var msgObj;
        try{
          msgObj = JSON.parse(msg);
        }catch(ex){
          return console.log(ex);
        }
        if(!msgObj.fnName){
          return console.log("no fn name.");
        }
        var fnName  = msgObj.fnName;
        var args    = msgObj.args;
        var cbID    = msgObj.nextCallbackID;
        var fn      = rtpipe.clientFn[fnName];
        if(!fn){
          return console.log("server requested invalid client fn: "+fnName);
        }
        var cb = null;
        if(cbID){
          cb = function(err, args, cb2){
            var nextcbID = 0;
            if(cb2){
              nextcbID      = nextCBID++;
              cbs[nextcbID] = cb2;
            }
            var msgObj = {
              fnName: "__cb", 
              err: err, 
              args: args, 
              cbID: cbID, 
              nextCallbackID: nextcbID
            };
            try{
              var msg = JSON.stringify(msgObj);
              sockjs.send(msg);
            }catch(ex){
              console.log(ex);
            }
          };
        }
        fn(msgObj.err, msgObj.args, cb||nullFn, msgObj.cbID);
      };
      sockjs.onclose   = function(){
        rtpipe.onclose(sockjs);
        lastConnectionEnded = (new Date()).getTime();
        if(options.autoReconnect){
          console.log("rt| auto reconnect.");
          setTimeout(_rtpipe_connect, 500*Math.min(15.0, Math.pow(2.0, sockMisconnects++)));
        }
      };
    }
    _rtpipe_connect();
    // -----------------
    var cbs = {};
    var nextCBID = 1;
    // -----------------
    rtpipe.clientFn = {}; // defined by client...
    rtpipe.clientFn.__cb = function(err, args, cb, cbID){
      var _cb = cbs[cbID];
      if(_cb){
        _cb(err, args, cb);
        delete cbs[cbID];
      }
    };
    // -----------------
    rtpipe.serverFn = function(fnName, args, cb){
      var nextcbID = 0;
      if(cb){
        nextcbID      = nextCBID++;
        cbs[nextcbID] = cb;
      }
      var msgObj = {fnName: fnName, args: args, nextCallbackID: nextcbID};
      try{
        var msg = JSON.stringify(msgObj);
        sockjs.send(msg);
      }catch(ex){
        return console.log(ex);
      }
    };
    // -----------------
    rtpipe.onready = function(conn){};
    rtpipe.onclose = function(conn){};
    return rtpipe;
  };
})();
// --
return rtpipe;
});
