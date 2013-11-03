

module.exports = {
  atb:          function(){return require("./server/appToolBelt.js");},
  lessr:        function(){return require("./server/lessr.js");},
  log:          function(){return require("./server/log.js");},
  reqjs:        function(){return require("./server/reqjs.js");},
  rtpipe:       function(){return require("./server/rtpipe.js");},
  sessionStore: function(){return require("./server/sessionStore.js");},
  // --
  clientLibDir: __dirname+"/client"
};


