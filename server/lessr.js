// LESSr
// makes optimizations and auto-updating of less simple.
var myname  = "lessr: ";
// --
var less    = require("less");
var fs      = require("fs"); 
// --
exports.addFile = function(absLessFile, absCSSFile, autoUpdate, options, extraWatches){
  var updates = 0;
  var optimizing = false;
  var runWhenDone = false;
  options = options||{};
  var fname = options.filename||"";
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
      less.render(dataString, options)
	      .then(function(output) {
	        // output.css = string of css
	        // output.map = string of sourcemap
	        // output.imports = array of string filenames of the imports referenced
					// --
					var cssString = output.css;
          if(!options.compress){
            cssString = cssString.replace(/\n\ \ /g, "\n"); 
          }
          // Write output
          fs.writeFileSync(absCSSFile, cssString, 'utf8');
          var t1 = new Date().getTime() - t0;
          console.log(myname+"-> "+fname+": created css in "+t1+"ms");
          onOptDone();
	      },function(error) {
          console.warn(myname+"error parsing LESS:");
          less.writeError(err, options);
          return onOptDone();
	      });
      if(updates === 0 && autoUpdate){
        console.log(myname+"-> "+fname+": adding autoUpdate.");
        fs.watchFile(absLessFile, {interval: options.autoMS||5007}, function (curr, prev) {
          if(prev.mtime !== curr.mtime){
            doOptimization();
          } 
        });
        if(extraWatches){
          for(var i=0; i<extraWatches.length; i++){
             fs.watchFile(extraWatches[i], {interval: options.autoMS||5007}, function (curr, prev) {
              if(prev.mtime !== curr.mtime){
                doOptimization();
              } 
            }); 
          }
        }
      }
      updates++;
    });
  }
  doOptimization();
};

