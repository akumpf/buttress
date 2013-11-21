// appToolBelt (atb)
// handy little functions to make get an app on its feet easier/faster.
var myname      = "atb: "; 
// -- 
var logHelp     = require("./log.js");
// --
module.exports = function(settings){
var exports = {};
var atb    = exports;
// --
exports.express     = require("express");
exports.underscore  = require("underscore");
// --
var express = exports.express;
var _       = exports.underscore;
// --
exports.getClientIp       = function(req){
  var ipAddress;
  var forwardedIpsStr = req.header('x-forwarded-for'); 
  if(forwardedIpsStr){
    ipAddress = forwardedIpsStr.split(',')[0];
  }
  if(!ipAddress){
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
};
exports.getClientIpBase36 = function(req){
  var ip = atb.getClientIp(req)||"";
  var ipa = ip.split(".")||[];
  var a = parseInt(ipa[0]||0, 10);
  var b = parseInt(ipa[1]||0, 10);
  var c = parseInt(ipa[2]||0, 10);
  var d = parseInt(ipa[3]||0, 10);
  var num = a*256*256*256;
  num += b*256*256;
  num += c*256; 
  num += d;  
  return num.toString(36);
};
exports.escapeHTML        = function(msg){
  return (msg||"").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/\>/g, "&gt;");
};
// --
exports.enableHighAvailability = function(http){
  log3("Enabling (posix) high availibility -> go go go!");
  try{
    var posix   = require('posix');
    var limits  = posix.getrlimit('nofile');
    log('* Default limits: soft=' + limits.soft + ', hard=' + limits.hard); 
    posix.setrlimit('nofile', { soft: 16384, hard: 32768 });
    var limitsNow = posix.getrlimit('nofile');
    log('* --> New limits: soft=' + limitsNow.soft + ', hard=' + limitsNow.hard);
    http.globalAgent.maxSockets = limitsNow.soft;
  }catch(ex){
    console.log(ex); 
    log7("* cannot enable high availability; no permission?");
  }
};
// --
var toobusy = null;
exports.appDefaultRoutes = function(app,maxLag){
  // middleware which blocks requests when we're too busy
  maxLag = maxLag||70;
  if(maxLag !== 70) console.log("toobusy: setting maxLag to "+maxLag+"ms"); 
  toobusy = toobusy||require('toobusy');
  toobusy.maxLag(maxLag);
  app.use(function(req, res, next) {
    if (toobusy()) return res.send(503, "I'm busy right now, sorry. Try back in a bit.");
    next();
  });
  // --
  app.use(express.compress()); // gzip (make things small before sending)
  app.use(express.bodyParser({keepExtensions: true}));
  app.use(express.cookieParser());
};
// --
exports.bytesToMB = function(num){
  num = (num||0)/(1024*1024.0);
  return num.toFixed(1)+"MB";
};
exports.useMemWatch = function(showStats, periodicHeapReport){
  var memwatch = require("memwatch");
  memwatch.on('leak', function(info){
    log9("memwatch: leak -> ");
    console.log(info);
  });
  if(showStats){
    memwatch.on('stats', function(stats){
      log5("memwatch: stats -> base = "+atb.bytesToMB(stats.current_base)+", usage_trend = "+stats.usage_trend+", inc_gc = "+stats.num_inc_gc+", full_gc = "+stats.num_full_gc); 
    });
  }
  // -- Periodic heap analysis if trying to find a problem. --
  if(periodicHeapReport){
    var hd;
    var HEAP_TO_KEEP = 3;
    setTimeout(function(){
      hd = new memwatch.HeapDiff();
    }, 5000);
    setInterval(function(){
      var diff = hd.end();
      log8("memwatch: diff -> before/after = "+diff.before.size+"/"+diff.after.size);
      var change = diff.change.details;
      change = change.sort(function(a,b){
        if(a.size_bytes > b.size_bytes) return -1;
        if(a.size_bytes < b.size_bytes) return  1;
        return 0;
      });
       
      if(change.length > HEAP_TO_KEEP) change = change.slice(0,HEAP_TO_KEEP);
      for(var i=0; i<change.length; i++){
        log8("[+"+change[i]["+"]+" / -"+change[i]["-"]+"] -> "+change[i].what+" -> size: "+change[i].size);
      }
      // --
      hd = new memwatch.HeapDiff();
    }, 180000);
  }
};
// --
exports.onShutdown = function(){
  if(toobusy) toobusy.shutdown();
  return process.exit();
};
// --
return exports;
};
