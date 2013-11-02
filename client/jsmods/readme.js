define(["markdown","lessadder","community"],
function(markdown,  lessadder,  community){
  var exports = {};
  var readme  = exports; 
  // --
  if(!settings.readme) console.warn("MISSING: settings.readme");
  if(!settings.readme.project_base_url) console.warn("MISSING: settings.readme.project_base_url");
  var projBaseURL = settings.readme.project_base_url||"http://example.com/?Project=";
  // --
  lessadder.addFile("readme");
  // --
  exports.showMarkdown = function(readmeURL, name, projID, htmlPre, bannerPrefix, markdownOverride){
    function render(markdownData){
      var html = htmlPre;
      if(bannerPrefix){
        html += "<img class='banner' src='"+bannerPrefix+"banner_720x135.jpg' /><hr/><br/>";
      }
      if(markdownData){
        html += markdown.toHTML(markdownData);
      }
      var projURL   = projBaseURL+projID;
      var htmlPost  = "<br/><hr/><br/><br/>"+community.getDisqusBox(projURL, name)+"<br/><br/>";
      $("#readme_viewer").remove();
      $("body").append("<div id='readme_viewer'><div class='framebox_closer'>&times;</div><div class='framebox' onclick='event.stopPropagation();' class='markdown_contents'>"+html+htmlPost+"</div></div>");
      $("#readme_viewer, .framebox_closer").on("click", function(){
        $("#readme_viewer").remove();
      });
      $("#readme_viewer .framebox").dontScrollParent();
    }
    if(markdownOverride){
      render(markdownOverride);
    }else{
      $.get(readmeURL, render);
    }
  };
  // --
  exports.addMyAboutBtn         = function(projID){
    $("#readme_about").remove(); // in case it was added before.
    $("body").append("<div id='readme_about'>About</div>");
    $("#readme_about").on("click", function(e){
      readme.showMarkdown("/_readme.md", "", projID, "", "/");
    });
  };
  exports.showProjectReadme     = function(port, name, projID, markdownOverride){
    var readmeURL     = "/_media/"+port+"_README.md";
    var htmlPre       = "<center><h2>"+escapeHTML(name)+"</h2></center><hr/><br/>";
    var bannerPrefix  = ""; 
    if(port){
      bannerPrefix  = "/_media/"+port+"_";
      htmlPre       = "<center><h2>#"+port+" / "+escapeHTML(name)+"</h2></center><hr/>";
    }
    // --
    readme.showMarkdown(readmeURL, name, projID, htmlPre, bannerPrefix, markdownOverride);
  };
  exports.getMarkdownForURL     = function(url, cb){
    $.get(url, function(markdownData){
      return cb(markdown.toHTML(markdownData||""));
    }); 
  }; 
  exports.getDisqusBoxForProjID = function(projID, name, cb){
    var projURL   = projBaseURL+projID;
    return cb(community.getDisqusBox(projURL, name));
  };
  // --
  return exports;
});