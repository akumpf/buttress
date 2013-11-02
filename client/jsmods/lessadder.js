define([],
function(){
  var exports   = {};
  var lessadder = exports;
  // --
  if(!window.less) console.warn("Module requires less!");
  // --
  exports.add = function(name, data){
    var env = {filename: "jsmod_"+name};
    new(less.Parser)(env).parse(data, function (err, cssAST) {
      if(err) return console.warn(err);
      // --
      try{
        var css = cssAST.toCSS(less);
        if(!css) return console.warn("no css?", name);
        // --
        var s = $("#less_jsmod_"+name).get(0);
        if(!s){
          s = document.createElement("style");
          document.head.appendChild(s);
          $(s).attr("id","less_jsmod_"+name);
        }
        // -- 
        s.type = 'text/css';
        if (s.styleSheet) {
            s.styleSheet.cssText = css;
        } else { 
            s.innerHTML = css;
        }
      }catch(ex){
        console.error("couldn't parse and update LESS.");
        console.error(ex);
      }
    });
  };
  exports.addFile = function(name){
    console.log(" -> loading less file via js: "+name);
    $.get("/_lib/less/"+name+".less",function(data){
      lessadder.add(name, data);
    });
  };
  // --
  return exports;
});
