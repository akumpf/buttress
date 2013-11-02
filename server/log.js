// HTML logger (log)
// color coded messages for printing html in the console.
var myname = "log: ";
// --
console._log = console.log;
console._getErrorObject = function(){
    try { throw Error(''); } catch(err) { return err; }
};
console.log = function(o, o2, o3, o4, o5, o6, o7){
  if(o2){
    // if more than one argument, don't fancy print.
    if(!o3) return console._log(o, o2);
    if(!o4) return console._log(o, o2, o3);
    if(!o5) return console._log(o, o2, o3, o4);
    if(!o6) return console._log(o, o2, o3, o4, o5);
    if(!o7) return console._log(o, o2, o3, o4, o5, o6);
    return console._log(o, o2, o3, o4, o5, o5, o6, o7);
  }
  if(typeof(o) !== 'string'){ 
    // if not a string, prepend with line info, but don't fancy print.
    logH("(see next line)", "#777");
    console._log(o);
  }else{
    // fancy print!
    logH(o.replace(/\n/g, "<br/>"), "#777");
  }
};
log = console.log;
log1 = function(m){
  logH(m, "#555");
};
log2 = function(m){
  logH(m, "#777");
};
log3 = function(m){
  logH(m, "#79A");
};
log4 = function(m){
  logH(m, "#ABC");
};
log5 = function(m){
  logH(m, "#EEE");
};
log6 = function(m){
  logH(m, "#F0F");
};
log7 = function(m){
  logH(m, "#0FF");
};
log8 = function(m){
  logH(m, "#FF0");
};
log9 = function(m){
  logH(m, "#F00");
};
function logH(msg, color){
  var err = console._getErrorObject();
  var caller_line = err.stack.split("\n")[5];
  var index = caller_line.indexOf("at ");
  var clean = caller_line.slice(index+2, caller_line.length);
  clean = clean.replace(/\'/g, "&apos;");
  var date =  new Date();
  var msg2 = msg;
  if(typeof(msg) == 'function'){ 
    msg2 = msg.toString();
  }
  var details = {mtime: date.getTime(), type: typeof(msg), from: clean};
  console._log("<span style='color: "+color+";'>"+msg+"</span> <span class='details' title='"+clean+"'>&gt;</span>");
}
logWarn = log8;
logErr  = log9;
// logErr = function(err, msg){
//   logH(msg+" (details below)", "#F00");
//   console._log(err);
// };
// --
logMem = function(){
  var mu = process.memoryUsage();
  var m = mu.heapTotal;
  m = (m/(1024.0*1000.0)).toFixed(3);
  var u = mu.heapUsed;
  u = (u/(1024.0*1000.0)).toFixed(3);
  log3("Mem Used: "+u+"/"+m+" MB");
};
var lastTimes = {};
logTime = function(key){
  key = key||"*";
  var t = new Date().getTime();
  if(lastTimes[key]){
    log3(key+": ms = "+t+" -- deltaT: "+(t-lastTimes[key]));
  }else{
    log3(key+": ms = "+t);
  }
  lastTimes[key] = t;
};
// --
logErrCB = function(msg, cb){
  logH(msg, "#F90");
  if(cb){
    return cb(msg);
  }else{
    logH("No callback in logErrCB, you should probably change that...","07F");
  }
};
