// LESSr
// makes optimizations and auto-updating of less simple.
var myname  = "lessr: ";
// --
var less    = require("less");
var fs      = require("fs"); 
// --
exports.addFile = function(absLessFile, absCSSFile, autoUpdate, options){
  var updates = 0;
  var optimizing = false;
  var runWhenDone = false;
  function onOptDone(){
    optimizing = false;
    if(runWhenDone){
      runWhenDone = false;
      doOptimization();
    }
  }
  function doOptimization(){
    if(optimizing){
      runWhenDone = true;
      return console.log(myname+"busy, will re-run shortly.");
    }
    optimizing = true;
    var t0 = new Date().getTime();
    fs.readFile(absLessFile, function(err, data){
      if(err){
        console.log(err);
        return onOptDone();
      }
      // --
      var dataString = (data||"").toString();
      var parser = new less.Parser(options);
      parser.parse(dataString, function(err, cssTree){
        if(err){
          console.warn(myname+"error parsing LESS:");
          less.writeError(err, options);
          return onOptDone();
        } 
        try{
          // Create the CSS from the cssTree
          var cssString = cssTree.toCSS({ 
            compress   : options.compress,
            yuicompress: options.yuicompress
          });
          if(!options.compress){
            cssString = cssString.replace(/\n\ \ /g, "\n"); 
          }
          // Write output
          fs.writeFileSync(absCSSFile, cssString, 'utf8');
          var t1 = new Date().getTime() - t0;
          console.log(myname+"created css in "+t1+"ms"); 
          onOptDone();
        }catch(ex){
          console.warn(myname+"error creating CSS from LESS:");
          less.writeError(ex, options);
          onOptDone();
        }
      });
      if(updates === 0 && autoUpdate){
        console.log(myname+"adding autoUpdate.");
        fs.watchFile(absLessFile, {interval: options.autoMS||5007}, function (curr, prev) {
          if(prev.mtime !== curr.mtime){
            doOptimization();
          } 
        }); 
      }
      updates++;
    });
  }
  doOptimization();
};

