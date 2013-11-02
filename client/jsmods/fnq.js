//
// Function Queue (FNQ)
// Useful for queuing heavy things like rendering, encoding, etc.
// runFn should always be in the form: function(qid, options, cb){...}
//

define([],
function(){
  var exports = {};
  var fnq     = exports;
  // --
  exports.create = function(name, runFn, debug){
    var queue   = [];
    var isBusy  = false;
    // --
    function removeAnyDuplicateQueueIDs(qid){
      for(var i=queue.length-1; i>=0; i--){
        if(queue[i][0] === qid){ 
          if(debug) console.log("fnq["+name+"]: removing duplicate job -> "+qid);
          queue.splice(i,1);
        }
      }
    }
    function nextFn(){
      if(queue.length <= 0){
        if(debug) console.log("fnq: no more jobs.");
        return;
      }
      var next = queue.shift();
      run(next[0], next[1], next[2]);
    }
    function run(qid, opts, cb){
      if(isBusy) return console.log("fnq: hey, we're already running.");
      isBusy = true;
      var alreadyCB = false;
       if(debug) console.log("fnq["+name+"]: running queued job ("+queue.length+" remaining)");
      setTimeout(function(){
        runFn(qid, opts, function(){
          if(alreadyCB) return console.warn("fnq["+name+"]: fn called callback multiple times!");
          alreadyCB = true;
          cb.apply(this, arguments);
          isBusy = false;
          return nextFn();
        });
      },0);
    }
    return {
      add: function(qid, opts, cb){
        qid = qid||Math.random().toString(32);
        if(isBusy){
          removeAnyDuplicateQueueIDs(qid);
          queue.push([qid, opts, cb]);
          if(debug) return console.log("fnq["+name+"]: adding job to queue ("+queue.length+" ahead)");
        }else{
          if(debug) console.log("fnq["+name+"]: running right away.");
          run(qid, opts, cb);
        }
      } 
    };
  };
  // --
  return exports;
});
