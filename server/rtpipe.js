//
// lightweight realtime communication framework
//
var sockjs  = require('sockjs');
var _       = require('underscore');
var crypto  = require('crypto');
// ---
var defaultOptions = {
  
};
// --
function _getNewRandomToken(callback){
   crypto.randomBytes(32, function(ex, buf) {
    var token = buf.toString('base64').replace(/\//g,'a').replace(/\+/g,'a').replace(/\=/g, '');
    callback(token);
  });
}
function _getClientIp(req) {
  var ipAddress;
  var forwardedIpsStr = req.header('x-forwarded-for'); 
  if(forwardedIpsStr){
    ipAddress = forwardedIpsStr.split(',')[0];
  }
  if(!ipAddress){
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
}
// ---
module.exports = function(options){
  if(!options || !options.server){
    return console.log("fail: no server defined in rtpipe options.");
  }
  if(!options.serverFn){
    return console.log("fail: no serverFn defined in rtpipe options.");
  }
  console.log("rt| initializing");
  options = _.defaults(options || {}, defaultOptions);
  // --
  var sessionStore  = options.sessionStore || null;
  var app           = options.app;
  var serverFn      = options.serverFn;
  var cbs           = {};
  var nextCBID      = 1;
  var rtp           = {};
  // --
  if(app && sessionStore){ 
    //console.log("rtp| installing session"); 
    app.get("/rt/getSessionToken", function(req, res){
      //console.log("-- getting session token");
      req.session = req.session || {}; 
      req.session.sync_ip = _getClientIp(req); 
      res.setHeader('Content-Type', 'text/plain');
      //console.log("getSessionToken: sessionID", req.sessionID);
      if(!req.sessionID){
        return res.end("0");
      }else{
        rtp.getSessionToken(req, function(token){
          res.end(token||"0");
        });
      }
    });
  }
  // --
  serverFn._echo                = function(err, conn, args, cb){
    console.log("[1/3] echoing! (start of 3 phase)");
    //console.log("session.user:");
    //console.log(conn.session.user);
    if(cb){
      cb(null, {ok: true}, function(err, conn, args, cb){
        if(err) console.log("ERROR: 2");
        console.log("[2/3] got echo confirmation.");
        if(cb){
          cb(null, {}, function(err, conn, args, cb){
            if(err) console.log("ERROR: 3");
            console.log("[3/3] got echo confirmation confirmation.");
          });
        }
      });
    }
  };
  serverFn._syncSessionViaToken = function(err, conn, args, cb){
    if(!sessionStore) return cb("ERROR: no token store.");
    if(!args || !args.token) return cb("ERROR: no token.");
    //console.log("auth via token. "+args.token);
    sessionStore.get(args.token, function(err, obj){
      if(err) console.log("sessionStore: ", err); 
      var t = (new Date()).getTime();
      if(!obj || !obj.time || !obj.sid || (t-obj.time > 120*1000)){
        console.log(obj);
        return cb("ERROR: invalid, expired, or claimed token.");
      }
      sessionStore.destroy(args.token, function(err){ // remove the token.
        if(err) return console.log(err);
      });
      sessionStore.load(obj.sid, function(err, session){
        if(err){
          console.log(err);
          return cb("ERROR: no session found.");
        }
        session = session || {};
        conn.session    = session;
        conn.sessionID  = obj.sid;
        // -- update conn.id
        delete connections[conn.id];
        conn.id = (conn.sessionID||conn.id).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        connections[conn.id] = conn;
        // --
        cb(null);
        rtp.onconnsyncd(conn);
      });
    });
  };
  serverFn._getTime             = function(err, conn, args, cb){
    if(cb) cb(new Date().getTime());
  };
  serverFn.__cb                 = function(err, conn, args, cb, cbID){
    var _cb = cbs[cbID];
    if(_cb){
      _cb(err, conn, args, cb);
      delete cbs[cbID];
    }
  };
  // --
  var connections = {};
  var nullFn = function(){};
  // --
  var rtpipeServer = sockjs.createServer({log: function(type, msg){
    if(type === 'error') console.log("rtp error", msg); 
  }}); 
  rtpipeServer.on('connection', function(conn) {
    // new connection.
    conn.id = conn.id.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    connections[conn.id] = conn;
    conn.clientFn = function(fnName, args, cb){
      var nextcbID = 0;
      if(cb){
        nextcbID      = nextCBID++;
        cbs[nextcbID] = cb;
      }
      var msgObj = {fnName: fnName, args: args, nextCallbackID: nextcbID};
      try{
        var msg = JSON.stringify(msgObj);
        conn.write(msg);
      }catch(ex){
        return console.log(ex);
      }
    };
    // --
    rtp.onconn(conn);
    // received a message. run local function and callback (if they exist)
    conn.on('data', function(msg) {
      var msgObj;
      try{
        msgObj = JSON.parse(msg);
      }catch(ex){
        console.log("JSON parse error");
        return console.log(ex);
      }
      if(!msgObj.fnName){
        return console.log("No fn name.");
      }
      var fnName  = msgObj.fnName;
      var args    = msgObj.args;
      var err     = msgObj.err;
      var cbID    = msgObj.nextCallbackID;
      var cb = null;
      if(cbID){ // client has defined callback function.
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
            conn.write(msg);
          }catch(ex){
            console.log(ex);
          }
        };
      }
      // check if desired function is available on the server.
      if(!serverFn[fnName]){
        if(cb) return cb("ERROR: Invalid serverFn function: "+fnName);
        return console.log("ERROR: Invalid serverFn function: "+fnName);
      }
      // run the server function.
      serverFn[fnName](err, conn, args, cb||nullFn, msgObj.cbID);
    });
    conn.on('close', function() {
      rtp.onclose(conn);
      delete connections[conn.id];
    });
  });
  rtpipeServer.installHandlers(options.server, {prefix:'/rtp'});
  // define exports...
  rtp.ready        = true;
  rtp.onconn       = function(conn){};
  rtp.onconnsyncd  = function(conn){};
  rtp.onclose      = function(conn){};
  rtp.connections  = connections;
  rtp.clientFn     = function(fnName, args, cb){
    _.each(connections, function(conn, id){
      conn.clientFn(fnName, args, cb);
    });
  };
  rtp.getSessionToken = function(req, cb){
    if(!sessionStore) return cb("0"); // no session store available.
    if(!req.sessionID) return cb("0"); // no session ID found.
    _getNewRandomToken(function(token){
      var t = (new Date()).getTime();
      sessionStore.set(token, {sid: req.sessionID, time: t, type: "rtpipetoken", cookie: {_expires: t+(30*1000)}},  function(err) { 
        if (err){
          console.log(err);
          return cb("0");
        }
        return cb(token);
      });
    });
  };
  // return inner exports
  return rtp;
};
