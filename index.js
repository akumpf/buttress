

module.exports = {
  atb:          function(){return require("./server/appToolBelt.js");},
  db:           function(){return require("./server/db.js");},
  emailauth:    function(){return require("./server/emailauth.js");},
  lessr:        function(){return require("./server/lessr.js");},
  log:          function(){return require("./server/log.js");},
  reqjs:        function(){return require("./server/reqjs.js");},
  rtpipe:       function(){return require("./server/rtpipe.js");},
  scrunch:      function(){return require("./server/scrunch.js");},
  sessionStore: function(){return require("./server/sessionStore.js");},
  // --
  clientLibDir: __dirname+"/client",
  serverLibDir: __dirname+"/server"
};


