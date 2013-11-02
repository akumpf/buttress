// LESSr
// makes optimizations and auto-updating of less simple.
var myname  = "lessr: ";
// --
var less    = require("less");
var fs      = require("fs"); 
// --
exports.addFile = function(absLessFile, absCSSFile, autoUpdate, options){
  var updates = 0;
  function doOptimization(){
    var t0 = new Date().getTime();
    fs.readFile(absLessFile, function(err, data){
      if(err) return console.log(err);
      // --
      try{
        var dataString = (data||"").toString();
        var parser = new less.Parser(options);
        parser.parse(dataString, function(err, cssTree){
          if(err) return less.writeError(err, options);
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
        });
      }catch(ex){
        console.log(myname+"error in parsing");
        console.log(ex);
      } 
      if(updates === 0 && autoUpdate){
        console.log(myname+"adding autoUpdate.");
        fs.watchFile(absLessFile, {interval: options.autoMS||5007}, function (curr, prev) {
          if(prev.size.toString() !== curr.size.toString()){
            doOptimization();
          } 
        });
      }
      updates++;
    });
  }
  doOptimization();
};
