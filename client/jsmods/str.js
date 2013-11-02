//
// String parsers/helpers
//

define([],
function(){
  var exports = {};
  var str     = exports; 
  // --
  exports.stringHash = function(str){
    var hash = 0, i, char;
    if (!str || str.length === 0) return hash;
    for (i = 0, l = str.length; i < l; i++) {
      char  = str.charCodeAt(i);
      hash  = ((hash<<5)-hash)+char;
      hash |= 0; // Convert to 32bit integer
    }
    return "txthash_"+hash;
  };
  // --
  exports.hideAllURLs = function(txt){
    return txt.replace(/http[^\s\\]*/g, "");
  };
  // --
  exports.parseURL_getYoutubeID = function(url) {
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match&&match[2].length==11){
      return match[2];
    }else{
      console.log("null youtube id: "+url);
      return null;
    }
  };
  exports.parseURL_getVimeoID = function(url) {
    var regExp = /https?:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/;
    var match = url.match(regExp);
    //console.log(match);
    if (match && match.length >= 3){
      return match[2];
    }
    return null;
  };
  exports.getVideoThumbImg = function(url) {
    if(!url) return "";
    var imgURL = "";
    var urlFlat = url.toLowerCase().replace(/[^A-Za-z0-9]/g, "");
    var id = null;
    if(urlFlat.indexOf("youtube") >= 0){
      id = str.parseURL_getYoutubeID(url);
      //console.log("YouTube ID: "+id);
      if(id) imgURL = "http://i.ytimg.com/vi/"+id+"/mqdefault.jpg";
    }
    if(urlFlat.indexOf("vimeo") >= 0){
      id = str.parseURL_getVimeoID(url);
      console.log("Viemo ID: "+id+" (TODO: get a thumbnail for this?)");
      // var id = parseURL_getYoutubeID(url);
      // console.log("YouTube ID: "+id);
      // if(id) imgURL = "http://i.ytimg.com/vi/"+id+"/mqdefault.jpg";
    }
    return imgURL;
  };
  // --
  return exports;
});
