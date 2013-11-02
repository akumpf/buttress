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
  var posix   = require('posix');
  var limits  = posix.getrlimit('nofile');
  log('* Default limits: soft=' + limits.soft + ', hard=' + limits.hard); 
  posix.setrlimit('nofile', { soft: 16384, hard: 32768 });
  var limitsNow = posix.getrlimit('nofile');
  log('* --> New limits: soft=' + limitsNow.soft + ', hard=' + limitsNow.hard);
  http.globalAgent.maxSockets = limitsNow.soft;
};
// --
return exports;
};
