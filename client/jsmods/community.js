
define([], 
function(){
  var exports   = {};
  var community = exports; 
  // --
  if(!settings.community) console.warn("MISSING: settings.community");
  if(!settings.community.disqus_shortname) console.warn("MISSING: settings.community.disqus_shortname");
  window.disqus_shortname = settings.community.disqus_shortname||"unknown_shortname";
  // --
  exports.getShareURL = function(service, msg, url){
    var toTweet   = msg;
    var toToTweet = toTweet.replace(/ /gi, "+");
    var mediaURL  = "";
    if(url){
      mediaURL = encodeURIComponent(url);
    }
    // --
    switch(service){
      case "twitter":
        //return 'http://twitter.com/intent/tweet?text='+toToTweet+'&hashtags=BandFu&related=ChaosOrg&url='+mediaURL;
        return 'https://twitter.com/intent/tweet?text='+toToTweet+'&url='+mediaURL;
      case "facebook":
        return "https://www.facebook.com/sharer.php?t="+encodeURIComponent(toTweet)+"&u="+mediaURL;
      case "googleplus":
        return "https://plus.google.com/share?url="+mediaURL;
    }
    console.warn("Unknown sharing service: "+service);
    return "";
  }; 
  exports.getShareBtn = function(service, msg, url){
    var shareURL = community.getShareURL(service, msg, url);
    return "<a href='"+shareURL+"' target='_blank'><div class='sharebtn "+service+"'></div></a>";
  };
  // --
  var disqus_countScriptAdded = false;
  exports.getDisqusBox = function(urlID, title){
    var safeURL   = (urlID||"").replace(/\"/g, "'");
    var safeTitle = (title||document.title||"").replace(/\"/g, "'");
    var html = "\
    <div id='disqus_thread'></div>\
    <script type='text/javascript'>\
      var disqus_shortname  = \""+disqus_shortname+"\";\
      var disqus_url        = \""+urlID+"\";\
      var disqus_title      = \""+safeTitle+"\";\
      (function() {\
        var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;\
        dsq.src = '//'+disqus_shortname+'.disqus.com/embed.js';\
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);\
      })();\
    </script>\
    ";
    return html;
  };
  exports.getDisqusCountDiv = function(urlID){
    return "<div class='comcount'><a class='disqus_count' href='"+urlID+"#disqus_thread' onclick='return false;'></a></div>";
  };
  exports.populateAllDisqusCounts = function(){
    if(disqus_countScriptAdded){
      if(window.DISQUSWIDGETS){
        DISQUSWIDGETS.getCount();
      }else{
        console.warn("already added disqus count script, but not loaded yet. should load soon.");
      }
    }else{
      disqus_countScriptAdded = true;
      (function () {
        var s   = document.createElement('script'); 
        s.async = true;
        s.type  = 'text/javascript';
        s.src   = '//'+disqus_shortname+'.disqus.com/count.js';
        (document.getElementsByTagName('HEAD')[0] || 
         document.getElementsByTagName('BODY')[0]).appendChild(s);
      }());
    }
  };
  // --
  return exports;
});