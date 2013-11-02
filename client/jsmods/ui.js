define(["lessadder"],
function(lessadder){
  var exports = {};
  var ui      = exports; 
  // --
  lessadder.addFile("ui");
  // --
  var lastDialogCallback = null;
  function showDialog(type, htmlMsg, closeOnScreen, cb, cbReady){
    closeDialog();
    lastDialogCallback = cb;
    var html = "<div class='ui_d_screen noSelect'><div class='ui_d_body "+type+"'>";
    html += htmlMsg;
    html += "</div></div>";
    $("body").append(html);
    // --
    if(closeOnScreen){
      $(".ui_d_screen").click(function(){
        closeDialog();
      });
    }
    // --
    $(".ui_d_body").dontScrollParent(".scroller");
    $(".ui_d_body .btn").click(function(){
      if($(this).hasClass("sel")) return closeDialog();
      var val = $(this).attr("data-val");
      if(val !== undefined && $(this).hasClass("bool")){
        val = !!parseInt(val,10);
      }
      console.log(val);
      closeDialog(val); 
    });
    if(cbReady){
      cbReady($(".ui_d_body")); 
    }
  }
  function closeDialog(result){
    result = (result===undefined)?null:result;
    $(".ui_d_screen").remove();
    if(lastDialogCallback) lastDialogCallback(result);
    lastDialogCallback = null;
  } 
  // --
  exports.alert = function(msg, cb){
    var msgHTML = escapeHTML(msg); 
    var html    = msgHTML + "<br/><br/><div class='btn close'>Close</div>";
    showDialog("alert", html, false, cb);
  };
  exports.confirm = function(question, cb){ 
    var msgHTML = escapeHTML(question); 
    var html    = msgHTML + "<br/><br/><div class='btn bool' data-val=1>Yes</div><div data-val=0 class='btn bool close'>Cancel</div>";
    showDialog("confirm", html, false, cb);
  };
  exports.prompt = function(question, val, placeholder, cb){
    var msgHTML = escapeHTML(question); 
    var inputHTML = "<input type='text' />";
    var html    = msgHTML + "<br/>"+inputHTML+"<br/><br/><div class='btn'>Okay</div><div class='btn close'>Cancel</div>";
    showDialog("prompt", html, false, cb, function($body){
      var $input = $body.find("input"); 
      $input.attr("placeholder", placeholder||"");
      $btn = $body.find(".btn");
      $btn.attr("data-val", val);
      $input.val(val);
      $input.keydown(function(e){
        // ENTER was pressed?
        if(e.which === 13){
          closeDialog($input.val());
        }
      });
      $input.on("change", function(){
        $btn.attr("data-val", $input.val());
      });
      $input.focus();
    });
  }; 
  exports.promptList = function(question, vals, selVal, cb){
    var msgHTML = escapeHTML(question); 
    var inputHTML = "<div class='scroller'>";
    vals = vals||[];
    for(var i=0; i<vals.length; i++){
      var val = vals[i];
      if(!val || val.length < 2 || val.length > 3){
        console.warn("invalid promptlist val:", val);
        continue;
      }
      inputHTML += "<div class='btn item "+(val[2]?val[2]:"")+((val[0]===selVal)?" sel":"")+"' data-val='"+val[0]+"'>"+escapeHTML(val[1])+"</div>";
    }
    inputHTML += "</div>";
    var html    = msgHTML + "<br/>"+inputHTML+"<br/><br/><div class='btn close'>Cancel</div>";
    showDialog("prompt", html, false, cb, function($body){
      
    });
  };
  // --
  $(document).keydown(function(e){
    // ESCAPE key pressed?
    if(e.which === 27){
      closeDialog();
    }
  });
  // --
  return exports;
});
