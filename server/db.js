// Database gateway (db)
// built for use by multiple projects, each with their own db.
var myname      = "db: ";
// --   
module.exports = function(settings, port, dbCollections){
var exports     = {};
var db          = exports;
var logHelp     = require("./log.js");
var _           = require("underscore");
// --
if(!settings) return log9(myname+"No settings object?");
if(!port) return log9(myname+"No port specified?");
if(!dbCollections) return log9(myname+"No dbCollections?");
// ----------------------------
// IMPORTANT APP-SPECIFIC VARS.
var MONGO_HOST    = settings.mongo_host   || "127.0.0.1";
var MONGO_PORT    = settings.mongo_port   || 27017;
var MONGO_USER    = settings.mongo_user   || "ProjUser";
var MONGO_PASS    = settings.mongo_pass   || "Password1234";
var MONGO_DBNAME  = settings.mongo_dbname || "Project"; 
// --
if(port === "NO_PORT") port = "";
MONGO_USER    += port;
MONGO_PASS    += port;
MONGO_DBNAME  += port;
// ----------------------------
var MAX_QUERY_RESULTS                   = 100; // >= 2
var MAX_QUERY_LOOP_COUNT                = 100;
var ENABLE_DB_PROFILING                 = false;
var UPDATE_DB_INDEXES_AFTER_CONNECTION  = false; // only need to do this once.
var DB_PROFILING_PRFILE                 = 1;
var DB_PROFILING_SLOW_MS                = 50;
// -- MongoDB!
var mongo         = require("mongodb");
var Db            = mongo.Db;
var Server        = mongo.Server;
// --
var dbServer      = new Server(MONGO_HOST, MONGO_PORT, {auto_reconnect: true});
var dbDB          = new Db(MONGO_DBNAME, dbServer, {native_parser:false, safe:true});
// --
var dbRoot        = ""; // root database
var dbReady       = false;
var dbReadyCb     = null;
// --
dbDB.open(function(err, db) {
  if(err) return logErr(err, myname+"could not open db");
  dbRoot = db;
  db.authenticate(MONGO_USER, MONGO_PASS, function(err, dbauth){
    if(err) return logErr(err, myname+"could not authenticate with db");
    // --
    if(ENABLE_DB_PROFILING){
      db.command({
        profile: DB_PROFILING_PRFILE, 
        slowms : DB_PROFILING_SLOW_MS
      }, function(err){
        if(err) return logErr(myname+"Unable to setup Db profiling.");
        if(DB_PROFILING_PRFILE > 0){
          log2(myname+"Db profiling enabled.");
        }else{
          log2(myname+"profiling disabled.");
        } 
      });
    }
    // --
    var total = _.size(dbCollections);
    var sofar = 0;
    _.each(dbCollections, function(val, key){
      db.collection(key, function(err, collection){
        if(err) return logErr(err, myname+"could not open collection: "+key);
        dbCollections[key] = collection;
        //console.log(myname+"opened db collection: "+key);
        sofar++;
        if(sofar === total){
          //console.log(myname+"all collections ready.");
          if(UPDATE_DB_INDEXES_AFTER_CONNECTION){
            createDBObjectIndexes();
          }
          dbReady = true;
          if(dbReadyCb){
            dbReadyCb();
          }
        }
      });  
    });
  });
});
exports.ready = function(cb){
  dbReadyCb = cb;
  if(dbReady) return cb();
};
// --
function createDBObjectIndexes(){
  console.log(myname+"ensuring db index...");
  // dbCollections.SessionEvents.ensureIndex('_session', {safe:true}, function(err, indexName) {
  //  if(err) logErr(err, myname+"unable to update object index.");
  //  log1(myname+"(+) index "+indexName);
  // }); 
  // dbCollections.SessionInfo.ensureIndex('_urlname', {safe:true}, function(err, indexName) {
  //  if(err) logErr(err, myname+"unable to update object index.");
  //  log1(myname+"(+) index "+indexName);
  // }); 
}
// --
exports.query           = function(dbObj, query, fields, skip, limit, orderby, callback){ 
  limit   = Math.max(0, Math.min(limit, MAX_QUERY_RESULTS));
  orderby = orderby||{_id: -1}; 
  var q2  = {$query: query, $orderby: orderby};
  dbObj.find(q2, fields||{}, skip, limit, function (err, cursor) {
    if(err){
      return callback("query failed.");
    }
    // cursor.count(function(err,count){
    //   console.log("err?", err);
    //   console.log("count?", count);
    // }); 
    cursor.toArray(function(err, docs) {
      return callback(err, docs);
    });
  });
};
exports.queryAndIterate = function(dbObj, query, fields, skip, limit, orderby, callback){
  if(!dbReady) return logErrCB(myname+"Not ready.", cb);
  var loopCount = 0;
  limit = limit||0;
  skip  = skip ||0;
  function fetch(){ 
    if(limit && skip >= limit) return callback(null, null);
    query(dbObj, query, fields, skip, 2, orderby, function(err, docs){ 
      if(err || !docs) return logErrCB(err, cb);
      skip++;
      if(docs.length > 0){
        callback(null, docs[0], fetch);
      }else{
        callback(null, null);
      }
    });
  }
  fetch();
};
exports.count           = function(dbObj, query, callback){
  if(!dbReady) return logErrCB(myname+"Not ready.", cb);
  dbObj.count(query, function (err, info) {
    if(err){
      return callback("count failed.");
    }
    return callback(null, info);
  });
};
exports.distinct        = function(dbObj, distinct, query, sortby, sortdir, maxormin, skip, limit, callback){ 
  if(!dbReady) return logErrCB(myname+"Not ready.", cb);
  limit = Math.max(0, Math.min(limit, MAX_QUERY_RESULTS));
  var grp = {_id: "$"+distinct};
  grp["max_"+sortby] = {$max: "$"+sortby};
  grp["min_"+sortby] = {$min: "$"+sortby};
  var srt = {};
  srt[maxormin+"_"+sortby] = sortdir;
  dbObj.aggregate([
    {$match: query},
    {$group : grp},
    {$sort: srt},
    {$skip: skip},
    {$limit: limit}
  ], function(err, result) {
    if(err) logErr(err, "db aggregation error");
    callback(err, result);
  });
};
exports.findByID        = function(dbObj, id, cb){
  if(!dbReady) return logErrCB(myname+"Not ready.", cb);
  id = db.asMongoObjectID(id); 
  // var idStr = id+"";
  // if(idStr && idStr.length === 24){
  //   try{
  //     var mID = mongo.ObjectID(idStr);
  //     id = mID;
  //   }catch(ex){
  //     console.log("looks like mongoID, but couldn't parse it.");
  //     console.log(ex);
  //   }
  // }
  dbObj.findOne({_id: id}, {}, cb);
};
// --
exports.asMongoObjectID = function(id){
  var idStr = id+"";
  if(idStr && idStr.length === 24){
    try{
      var mID = mongo.ObjectID(idStr);
      id = mID;
    }catch(ex){
      console.log("looks like mongoID, but couldn't parse it.");
      console.log(ex);
    }
  }
  return id;
};
// --
return exports;
};
