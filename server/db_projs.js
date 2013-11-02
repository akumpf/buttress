// Database gateway for Project meta info 
// this handles cross-project storage for high-level state (projects, users, sessions)
var myname      = "db_projs: ";
// --   
module.exports = function(settings){
var exports     = {};
var db_projs    = exports;
var logHelp     = require("./log.js");
var _           = require("underscore");
// --
if(!settings) return log9(myname+"No settings object?");
// --
var dbReady = false;
var dbc = {
  Projects: null
}; 
var db = require("./db.js")(settings, "NO_PORT", dbc);
db.ready(function(){
  dbReady = true;
  log1(myname+"ready");
});
// ----------------------------
// app-specific. 
// ---------------------------- 
var _safeFieldsToReturn = {_id:1, desc:1, _ct:1, stage:1, pts:1, port:1, link:1};
// --
exports.add                 = function(desc, cb){
  if(!dbReady)  return logErrCB(myname+"not ready yet.", cb);
  if(!desc)     return logErrCB(myname+"no desc.", cb);
  // --
  var dbObj = dbc.Projects;
  var now   = new Date().getTime();
  // --
  var pInfo     = {};
  pInfo.desc    = desc;
  pInfo.stage   = "proposed";
  pInfo.pts     = 0;
  pInfo.pts_ips = [];
  pInfo._ct     = now;
  pInfo._mt     = now;
  // --
  dbObj.save(pInfo, {safe: true}, function(err, result){
    if(err) return logErrCB("Could not save new project doc!", cb);
    // --
    log3("New project idea added.");
    return cb(null, result);
  });
};
exports.getByID             = function(projID, cb){
  if(!dbReady)  return logErrCB(myname+"not ready yet.", cb);
  if(!projID) return cb(myname+"no projID.");
  // --
  var dbObj = dbc.Projects; 
  projID    = projID+"";
  // --
  dbObj.findOne({_id: db.asMongoObjectID(projID)}, _safeFieldsToReturn, function (err, doc) {
    if(err) return logErrCB("error reading from db.", cb);
    if(doc === null){
      return cb("No doc found.");
    }else{
      return cb(null, doc);
    } 
  });
};
exports.updateDesc          = function(projID, desc, cb){
  if(!dbReady)    return logErrCB(myname+"not ready yet.", cb);
  // --
  var dbObj = dbc.Projects;
  var now = new Date().getTime();
  // --  
  db_projs.getByID(projID, function(err, pInfo){
    if(err) return logErrCB(err,cb);
    dbObj.update({_id: db.asMongoObjectID(projID)}, {$set: {"desc": desc, "_mt": now}}, {safe:true}, function(err, res){
      if(err) return logErrCB(err, cb);
      db_projs.getByID(projID, cb);
    });
  });
};
exports.updateLink          = function(projID, link, cb){
  if(!dbReady)    return logErrCB(myname+"not ready yet.", cb);
  // --
  var dbObj = dbc.Projects;
  var now = new Date().getTime();
  // --  
  db_projs.getByID(projID, function(err, pInfo){
    if(err) return logErrCB(err,cb);
    dbObj.update({_id: db.asMongoObjectID(projID)}, {$set: {"link": link||"", "_mt": now}}, {safe:true}, function(err, res){
      if(err) return logErrCB(err, cb);
      db_projs.getByID(projID, cb);
    });
  });
};
exports.upPoints            = function(projID, ip, cb){
  if(!dbReady)    return logErrCB(myname+"not ready yet.", cb);
  // --
  var dbObj = dbc.Projects;
  var now = new Date().getTime();
  // --  
  db_projs.getByID(projID, function(err, pInfo){
    if(err) return logErrCB(err,cb);
    var update = {$inc: {pts: 1}};
    var query  = {_id: db.asMongoObjectID(projID)};
    if(ip){
      update["$addToSet"] = {"pts_ips": ip};
      query["pts_ips"]    = {$ne: ip}; 
    }
    dbObj.update(query, update, {safe:true}, function(err, res){
      if(err) return logErrCB(err, cb);
      db_projs.getByID(projID, cb);
    });
  });
};
exports.dnPoints            = function(projID, ip, cb){
  if(!dbReady)    return logErrCB(myname+"not ready yet.", cb);
  // --
  var dbObj = dbc.Projects;
  var now = new Date().getTime();
  // --  
  db_projs.getByID(projID, function(err, pInfo){
    if(err) return logErrCB(err,cb);
    var update = {$inc: {pts: -1}};
    if(ip){
      var ips = pInfo.pts_ips||[];
      for(var i=0; i<ips.length; i++){
        if(ips[i] === ip) return logErrCB("already voted", cb);
      }
      update.$addToSet = {pts_ips: ip};
    }
    dbObj.update({_id: db.asMongoObjectID(projID)}, update, {safe:true}, function(err, res){
      if(err) return logErrCB(err, cb);
      db_projs.getByID(projID, cb);
    });
  });
};
// --
exports.getActive           = function(recentToGet, cb){
  if(!dbReady)    return logErrCB(myname+"not ready yet.", cb);
  // --
  var dbObj = dbc.Projects;
  // -- 
  db.query(dbObj, {stage: "active"}, _safeFieldsToReturn, 0, recentToGet, {_mt: -1}, function(err, docs){ 
    if(err) return logErrCB(err, cb);
    // --
    return cb(null, docs);
  });
};
exports.getAllLatest        = function(recentToGet, cb){
  if(!dbReady)    return logErrCB(myname+"not ready yet.", cb);
  // --
  var dbObj = dbc.Projects;
  // --  
  db.query(dbObj, {}, _safeFieldsToReturn, 0, recentToGet, {_ct: -1}, function(err, docs){ 
    if(err) return logErrCB(err, cb);
    // --
    return cb(null, docs);
  });
};
exports.getProposedHiScore  = function(recentToGet, includeActive, cb){
  if(!dbReady)    return logErrCB(myname+"not ready yet.", cb);
  // --
  var dbObj = dbc.Projects;
  // --
  var q = {stage: {$in: ["proposed","developing"]}};
  if(includeActive){
    q.stage.$in.push("active");
  }
  // -- 
  db.query(dbObj, q, _safeFieldsToReturn, 0, recentToGet, {stage:1, pts: -1, _ct: -1}, function(err, docs){ 
    if(err) return logErrCB(err, cb);
    // --
    return cb(null, docs);
  });
};
exports.getArchivedRecently = function(recentToGet, cb){
  if(!dbReady)    return logErrCB(myname+"not ready yet.", cb);
  // --
  var dbObj = dbc.Projects;
  // --  
  db.query(dbObj, {stage: "archived"}, _safeFieldsToReturn, 0, recentToGet, {_mt: -1}, function(err, docs){
    if(err) return logErrCB(err, cb);
    // --
    return cb(null, docs);
  });
};
exports.getStatic           = function(recentToGet, cb){
  if(!dbReady)    return logErrCB(myname+"not ready yet.", cb);
  // --
  var dbObj = dbc.Projects;
  // --  
  db.query(dbObj, {stage: "static"}, _safeFieldsToReturn, 0, recentToGet, {_mt: -1}, function(err, docs){
    if(err) return logErrCB(err, cb);
    // --
    return cb(null, docs);
  });
};
// --
exports.getProposedDevCount = function(cb){
  if(!dbReady)    return logErrCB(myname+"not ready yet.", cb);
  // --
  var dbObj = dbc.Projects;
  // --
  var q = {stage: {$in: ["proposed","developing"]}};
  // -- 
  db.count(dbObj, q, cb); 
};
exports.searchForName       = function(name, cb){
  if(!dbReady)  return logErrCB(myname+"not ready yet.", cb);
  if(!name)     return logErrCB(myname+"no name.", cb);
  // --
  var dbObj   = dbc.Projects;
  name = name+"";
  // --
  var regexpName  = new RegExp("^"+name, "i");
  var R           = 8;
  var retFields   = _safeFieldsToReturn; 
  var retSort     = {desc: -1};
  db.query(dbObj, {$or: [
    {desc:    regexpName}
  ]}, retFields, 0, R, retSort, function(err, results){
    if(err) return cb(err);
    if(results.length >= R) return cb(err, results);
    // --
    var firstHitIDs = []; 
    for(var i=0; i<results.length; i++) firstHitIDs.push(results[i]._id);
    // secondary search, we didn't see any results. loosen it up.
    var regexpName2 = new RegExp(" "+name, "i");
    db.query(dbObj, {$or: [
      {desc:    regexpName2},
    ],
    _id: {$not: {$in: firstHitIDs}}}, retFields, 0, R-results.length, retSort, function(err, res2){
      if(err) return cb(null, results);
      results = results.concat(res2);
      if(results.length >= R) return cb(null, results);
      // --
      for(var i=0; i<res2.length; i++) firstHitIDs.push(res2[i]._id);
      // -- 
       var regexpName3 = new RegExp(name, "i");
      db.query(dbObj, {$or: [
        {desc:    regexpName3},
      ],
      _id: {$not: {$in: firstHitIDs}}}, retFields, 0, R-results.length, retSort, function(err, res3){
        if(err) return cb(null, results);
        results = results.concat(res3);
        return cb(null, results);  
      });
    });
  });
};
// --
exports.getHighestUsedPort  = function(cb){
  if(!dbReady)  return logErrCB(myname+"not ready yet.", cb);
  // --
  var dbObj = dbc.Projects; 
  // --
  db.query(dbObj, {port: {$exists: 1}}, _safeFieldsToReturn, 0, 1, {port: -1}, function (err, docs) {
    if(err) return logErrCB("error reading from db.", cb);
    if(docs === null || docs.length < 1){
      console.log(myname+"no docs found with port.");
      return cb(err, 4000);
    }else{
      var doc = docs[0];
      console.log("Highest used port: "+doc.port);
      return cb(err, doc.port||4000);
    } 
  });
}; 
// --
exports.updateStageToDeveloping   = function(projID, cb){
  if(!dbReady)    return logErrCB(myname+"not ready yet.", cb);
  if(!projID) return cb(myname+"no projID.");
  // --
  var dbObj = dbc.Projects;
  var now   = new Date().getTime();
  projID    = projID+"";
  // --  
  db_projs.getByID(projID, function(err, pInfo){
    if(err) return logErrCB(err,cb);
    if(pInfo.stage !== "proposed")    return logErrCB("Wrong initial stage.", cb);
    if(pInfo.stage === "developing")  return logErrCB("Already at that stage.", cb);
    db_projs.getHighestUsedPort(function(err, port){
      if(err) return logErrCB(err,cb);
      var nextPort = port+1;
      dbObj.update({_id: db.asMongoObjectID(projID)}, {$set: {stage: "developing", port: nextPort, "_mt": now}}, {safe:true}, function(err, res){
        if(err) return logErrCB(err, cb);
        log3("Project migrated to: developing");
        db_projs.getByID(projID, cb);
      });
    });
  });
};
exports.updateStageToActive       = function(projID, cb){
  if(!dbReady)  return logErrCB(myname+"not ready yet.", cb);
  if(!projID)   return cb(myname+"no projID.");
  // --
  var dbObj = dbc.Projects;
  var now   = new Date().getTime();
  projID    = projID+"";
  // --  
  db_projs.getByID(projID, function(err, pInfo){
    if(err) return logErrCB(err,cb);
    if(pInfo.stage !== "developing")  return logErrCB("Wrong initial stage.", cb);
    if(pInfo.stage === "active")      return logErrCB("Already at that stage.", cb);
    dbObj.update({_id: db.asMongoObjectID(projID)}, {$set: {stage: "active", "_mt": now}}, {safe:true}, function(err, res){
      if(err) return logErrCB(err, cb);
      log3("Project migrated to: active");
      db_projs.getByID(projID, cb);
    });
  });
};
exports.updateStageToArchived     = function(projID, cb){
  if(!dbReady)  return logErrCB(myname+"not ready yet.", cb);
  if(!projID)   return cb(myname+"no projID.");
  // --
  var dbObj = dbc.Projects;
  var now   = new Date().getTime();
  projID    = projID+"";
  // --  
  db_projs.getByID(projID, function(err, pInfo){
    if(err) return logErrCB(err,cb);
    if(pInfo.stage !== "active")    return logErrCB("Wrong initial stage.", cb);
    if(pInfo.stage === "archived")  return logErrCB("Already at that stage.", cb);
    dbObj.update({_id: db.asMongoObjectID(projID)}, {$set: {stage: "archived", "_mt": now}}, {safe:true}, function(err, res){ 
      if(err) return logErrCB(err, cb);
      log3("Project migrated to: archived");
      db_projs.getByID(projID, cb);
    });
  });
};
exports.updateStageToUnarchived   = function(projID, cb){
  if(!dbReady)    return logErrCB(myname+"not ready yet.", cb);
  if(!projID) return cb(myname+"no projID.");
  // --
  var dbObj = dbc.Projects;
  var now   = new Date().getTime();
  projID    = projID+"";
  // --  
  db_projs.getByID(projID, function(err, pInfo){
    if(err) return logErrCB(err,cb);
    if(pInfo.stage !== "archived")    return logErrCB("Wrong initial stage.", cb);
    if(pInfo.stage === "developing")  return logErrCB("Already at that stage.", cb);
    dbObj.update({_id: db.asMongoObjectID(projID)}, {$set: {stage: "developing", "_mt": now}}, {safe:true}, function(err, res){
      if(err) return logErrCB(err, cb);
      log3("Project migrated to: unarchived/developing");
      db_projs.getByID(projID, cb);
    });
  });
};
exports.updateStageToStatic       = function(projID, cb){
  if(!dbReady)  return logErrCB(myname+"not ready yet.", cb);
  if(!projID)   return cb(myname+"no projID.");
  // --
  var dbObj = dbc.Projects;
  var now   = new Date().getTime();
  projID    = projID+"";
  // --  
  db_projs.getByID(projID, function(err, pInfo){
    if(err) return logErrCB(err,cb);
    if(pInfo.stage !== "proposed")    return logErrCB("Wrong initial stage.", cb);
    db_projs.getHighestUsedPort(function(err, port){
      if(err) return logErrCB(err,cb);
      var nextPort = port+1;
      dbObj.update({_id: db.asMongoObjectID(projID)}, {$set: {stage: "static", port: nextPort, "_mt": now}}, {safe:true}, function(err, res){
        if(err) return logErrCB(err, cb);
        log3("Project migrated to: static");
        db_projs.getByID(projID, cb);
      });
    });
  });
};
exports.updateStage               = function(projID, stage, cb){
  if(!dbReady)    return logErrCB(myname+"not ready yet.", cb);
  if(!projID) return cb(myname+"no projID.");
  if(!stage) return cb(myname+"no stage.");
  // -- 
  var dbObj = dbc.Projects;
  var now   = new Date().getTime();
  projID    = projID+"";
  stage     = stage+"";
  if(stage !== "proposed" && stage !== "developing" &&
     stage !== "active" && stage !== "archived" && stage !== "static"){
       return logErrCB("Invalid stage: "+stage, cb);
     }
  // --  
  db_projs.getByID(projID, function(err, pInfo){
    if(err) return logErrCB(err,cb);
    dbObj.update({_id: db.asMongoObjectID(projID)}, {$set: {stage: stage, "_mt": now}}, {safe:true}, function(err, res){
      if(err) return logErrCB(err, cb);
      log4("Project stage set to: "+stage);
      db_projs.getByID(projID, cb);
    });
  });
};
// --
return exports;
};

