define(["saveas"],
function(saveas){
  // --
  if(!settings.usercam) console.warn("MISSING: settings.usercam");
  settings.usercam = settings.usercam||{};
  // --
  var VIDEO_W     = settings.usercam.video_w||960;
  var VIDEO_H     = settings.usercam.video_h||720;
  var VIDEO_FPS   = settings.usercam.frameRate||4;
  var CANVAS_ZOOM = settings.usercam.zoom||1.0;
  var OPEN_AT_RES = false;
  // --
  var video, canvas, img, imgCtx, frames;
  // ---
  var ctx         = [];
  var vstream     = null;
  var frameCount  = 0;
  // ---
  function snapshot() {
    if (vstream) {
      ctx[0].drawImage(videoEl, VIDEO_W*(1.0-CANVAS_ZOOM)/2.0, VIDEO_H*(1.0-CANVAS_ZOOM)/2.0, VIDEO_W*CANVAS_ZOOM, VIDEO_H*CANVAS_ZOOM);
      frameCount++;
    }
  }
  
  // ---
  var videoEl  = null;
  var canvasEl = null;
  function fallback(e) {
    videoEl.src = '';
    console.log("fallback.", e);
  }
  function success(stream){
    console.log("USERCAM: stream is open.");
    vstream   = stream;
    videoEl.src = window.URL.createObjectURL(stream);
    videoEl.onerror = function () {
      stream.stop();
    };
    stream.onended = fallback;
    setTimeout(function(){
      snapshot();
      setInterval(function(){
        if(!vstream) return;
        snapshot();
      }, 1000/VIDEO_FPS); 
      //setInterval(playFrame, 250);
    }, 1000);
  }
  // ---
  //var playIndex   = 0;
  //var playing     = true;
  //var PLAY_FRAMES = 20;
  // function playFrame(){
  //   if(speedup) return;
  //   if(!playing) return;
  //   var imgs = $("#frames img");
  //   if(playIndex < imgs.length){
  //     if(playIndex >= 0){
  //       var img = imgs[playIndex];
  //       $("#playImg")[0].src = img.src;
  //     }
  //     playIndex++;
  //     // start playing from the end-5 frames.
  //     if(playIndex === 0){
  //       playIndex = Math.max(0, imgs.length-PLAY_FRAMES); 
  //     }
  //   }else{
  //     playIndex = -5; // holdoff when sequence reaches the end.
  //   }
  // }
  // -------
  function init(videoSel, canvasSel){
    if(!videoSel)  console.warn("No videoSel in init.");
    if(!canvasSel) console.warn("No canvasSel in init.");
    // --
    videoEl   = $(videoSel).get(0);
    canvasEl  = $(canvasSel).get(0);
    $(videoEl).css({width: (VIDEO_W)+"px", height: (VIDEO_H)+"px"});
    $(videoEl).attr("width", VIDEO_W).attr("height", VIDEO_H);
    $(canvasEl).attr("width", VIDEO_W).attr("height", VIDEO_H);
    ctx[0]  = canvasEl.getContext('2d');
    // --
    videoEl.addEventListener('loadeddata', function() {
      console.log('Video dimensions: ' + videoEl.videoWidth + ' x ' + videoEl.videoHeight);
    }, false);
    if(!navigator.getUserMedia){
      fallback();
    }else{
      if(OPEN_AT_RES){
        //navigator.getUserMedia({video: {width: VIDEO_W, height: VIDEO_H, maxFrameRate: VIDEO_FPS}, audio: false}, success, fallback);
      }else{
        navigator.getUserMedia({video: true, audio: false}, success, fallback);
      }
    }
  }
  
  function getImage(){
    if(canvasEl && vstream){
      return canvasEl.toDataURL();
    }else{
      return null;
    }
  }
  
  // function setCurrentAsBG(){
  //   console.log("setting bg");
  //   var _ctx = ctx[0];
  //   _ctx.drawImage(video, 0, 0, VIDEO_W, VIDEO_H);
  //   var t = (new Date()).getTime();
  //   var _canvas = canvas[0];
  //   var imageData = _ctx.getImageData(0, 0, _canvas.width, _canvas.height);
  //   var data = imageData.data;
  //   var pix = _canvas.width * _canvas.height * 4;
  //   var newBGImageData = new Array(_canvas.width * _canvas.height);
  //   while (pix > 0)
  //     //newBGImageData[pix -= 1] = 255-data[pix]+5;
  //     newBGImageData[pix -= 1] = 265.0/(data[pix]+5);
  //   console.log("calc bg diffs: "+((new Date()).getTime()-t));
  //   bgImageData = newBGImageData;
  // }
  // function clearBG(){
  //   console.log("clearing bg");
  //   var pix = VIDEO_W * VIDEO_H*4;
  //   var newBGImageData = new Array(pix);
  //   while (pix > 0)
  //     newBGImageData[pix -= 1] = 1.0;
  //   bgImageData = newBGImageData;
  // }
  
  /*
  var HOMOGRAPHY_MATRIX = new Matrix.I(3);
  var useHomography     = false;
  // --
  var lastHomographyMaxI = [0,VIDEO_W/DIV-1,VIDEO_W/DIV-1+(VIDEO_H/DIV-1)*VIDEO_W/DIV,(VIDEO_H/DIV-1)*VIDEO_W/DIV];
  function computeHomography(maxIforce){
    var index = 1;
    ctx[1].drawImage(video, 0, 0, VIDEO_W/DIV, VIDEO_H/DIV);
    var t = (new Date()).getTime();
    var _ctx = ctx[index];
    var _canvas = canvas[index];
    var imageData = _ctx.getImageData(0, 0, _canvas.width, _canvas.height);
    var data = imageData.data;
    var pix1, pix2, pix = _canvas.width * _canvas.height * 4;
    var grayPx = new Array(_canvas.width * _canvas.height);
    while (pix > 0){
      data[pix -= 4] = data[pix1 = pix + 1] = data[pix2 = pix + 2] = (data[pix] * 0.3 + data[pix1] * 0.59 + data[pix2] * 0.11);
      grayPx[(pix+4)/4] = data[pix1];
    }
    
    var maxI    = [0,0,0,0];
    var maxIVal = [-255,-255,-255,-255];
    var x, y, i, score, segment;
    var h = _canvas.height;
    var w = _canvas.width;
    if(!maxIforce){
      for(i=0; i<grayPx.length; i++){
      x = i%_canvas.width;
      y = i/_canvas.width;
      if(x < 4 || y < 4 || x >= w-5 || y >= h-5) continue;
      segment = (x<w/2)?( (y<h/2)?0:3 ):( (y<h/2)?1:2 );
      score = - 2.0*grayPx[i] +
              0.25*(grayPx[i-2]+grayPx[i+2]+grayPx[i-2*w]+grayPx[i+2*w]) +
              0.18*(grayPx[i-2-2*w]+grayPx[i+2+2*w]+grayPx[i-2+2*w]+grayPx[i+2-2*w]) +
              0.15*(grayPx[i-4]+grayPx[i+4]+grayPx[i-4*w]+grayPx[i+4*w]);
      if(score > maxIVal[segment]){
        maxIVal[segment] = score;
        maxI[segment] = i-1;
      }
      grayPx[i] = 64+grayPx[i]/2;
    }
    }else{
      maxI = maxIforce;
    }
    lastHomographyMaxI = maxI;
    // draw red crosshair for debug on corners
    for(i=0; i<maxI.length; i++){
      data[(maxI[i]+0)*4] = 255; data[(maxI[i]+0)*4+1] = 0; data[(maxI[i]+0)*4+2] = 0;
      data[(maxI[i]+w)*4] = 255; data[(maxI[i]+w)*4+1] = 0; data[(maxI[i]+w)*4+2] = 0;
      data[(maxI[i]-w)*4] = 255; data[(maxI[i]-w)*4+1] = 0; data[(maxI[i]-w)*4+2] = 0;
      data[(maxI[i]+2*w)*4] = 255; data[(maxI[i]+2*w)*4+1] = 0; data[(maxI[i]+2*w)*4+2] = 0;
      data[(maxI[i]-2*w)*4] = 255; data[(maxI[i]-2*w)*4+1] = 0; data[(maxI[i]-2*w)*4+2] = 0;
      data[(maxI[i]+1)*4] = 255; data[(maxI[i]+1)*4+1] = 0; data[(maxI[i]+1)*4+2] = 0;
      data[(maxI[i]-1)*4] = 255; data[(maxI[i]-1)*4+1] = 0; data[(maxI[i]-1)*4+2] = 0;
      data[(maxI[i]+2)*4] = 255; data[(maxI[i]+2)*4+1] = 0; data[(maxI[i]+2)*4+2] = 0;
      data[(maxI[i]-2)*4] = 255; data[(maxI[i]-2)*4+1] = 0; data[(maxI[i]-2)*4+2] = 0;
    }
    var l = [];
    l.push($V([Math.floor(maxI[0]%w*DIV), Math.floor(maxI[0]/w*DIV), 1.0]));
    l.push($V([Math.floor(maxI[1]%w*DIV), Math.floor(maxI[1]/w*DIV), 1.0]));
    l.push($V([Math.floor(maxI[2]%w*DIV), Math.floor(maxI[2]/w*DIV), 1.0]));
    l.push($V([Math.floor(maxI[3]%w*DIV), Math.floor(maxI[3]/w*DIV), 1.0]));
    var r = [];
    r.push($V([0,0,1]));
    r.push($V([w*DIV,0,1]));
    r.push($V([w*DIV,h*DIV,1]));
    r.push($V([0,h*DIV,1]));
    // --
    HOMOGRAPHY_MATRIX = computer4PointHomography(r, l);
    console.log(HOMOGRAPHY_MATRIX);
    useHomography = true;
    _ctx.putImageData(imageData, 0, 0);
    // draw lines
    _ctx.strokeStyle = 'rgba(0,255, 255, 128)';
    _ctx.beginPath();
    _ctx.moveTo(maxI[0]%w,maxI[0]/w);
    _ctx.lineTo(maxI[1]%w,maxI[1]/w);
    _ctx.lineTo(maxI[2]%w,maxI[2]/w);
    _ctx.lineTo(maxI[3]%w,maxI[3]/w);
    _ctx.closePath();
    _ctx.stroke();
    //console.log("time to compute homography: "+((new Date()).getTime()-t));
  }
  function applyHomography(input, output){
    //console.log("applying homography");
    var t = (new Date()).getTime();
    var _ctx        = ctx[input];
    var _canvas     = canvas[input];
    var _imageData  = _ctx.getImageData(0, 0, _canvas.width, _canvas.height);
    var _data       = _imageData.data;
    
    var _ctx2       = ctx[output];
    var _canvas2    = canvas[output];
    var _imageData2 = _ctx2.getImageData(0, 0, _canvas2.width, _canvas2.height);
    var _data2      = _imageData2.data;
    
    var w = _canvas2.width;
    var h = _canvas2.height;
    
    var xx,yy,zz;
    var hom_00 = HOMOGRAPHY_MATRIX.elements[0][0];
    var hom_01 = HOMOGRAPHY_MATRIX.elements[0][1];
    var hom_02 = HOMOGRAPHY_MATRIX.elements[0][2];
    var hom_10 = HOMOGRAPHY_MATRIX.elements[1][0];
    var hom_11 = HOMOGRAPHY_MATRIX.elements[1][1];
    var hom_12 = HOMOGRAPHY_MATRIX.elements[1][2];
    var hom_20 = HOMOGRAPHY_MATRIX.elements[2][0];
    var hom_21 = HOMOGRAPHY_MATRIX.elements[2][1];
    var hom_22 = HOMOGRAPHY_MATRIX.elements[2][2];
    var iroot, xyw4;
    var _dataBG = bgImageData;
    for(y=0;y<h;y++){
      for(x=0;x<w;x++){
        xx = hom_00*x + hom_01*y + hom_02;
        yy = hom_10*x + hom_11*y + hom_12;
        zz = hom_20*x + hom_21*y + hom_22; 
        iroot = Math.floor(1.0*xx/zz+0.5) + Math.floor(1.0*yy/zz+0.5)*w;
        xyw4 = (x+y*w)*4;
        _data2[xyw4]   = (_data[iroot*4+0]+5)*_dataBG[iroot*4]  +PX_NOISE;
        _data2[xyw4+1] = (_data[iroot*4+1]+5)*_dataBG[iroot*4+1]+PX_NOISE;
        _data2[xyw4+2] = (_data[iroot*4+2]+5)*_dataBG[iroot*4+2]+PX_NOISE;
      }
    }
    _ctx2.putImageData(_imageData2, 0, 0);
    //console.log("apply homography: "+((new Date()).getTime()-t));
  }
  function computer4PointHomography(l, r){
    //ComputeHomography4Points(VPoint *l, VPoint *r, Matrix &H){
    
    //VPoint cp[6],col[3],lig[3],pv[3];
    var i,j;
    var cp  = new Array(6);
    var col = new Array(3);
    var lig = new Array(3);
    var pv  = new Array(3);
    
    //double det[6];
    var det = new Array(6);
    
    //Matrix H1inv,H2,tmp;
    var H1inv = new Matrix.I(3);
    var H2    = new Matrix.I(3);
    var tmp   = new Matrix.I(3);
    
    var H     = new Matrix.I(3);
    
    // cp[0].CrossProduct(r[2],r[3]);
    // cp[1].CrossProduct(r[0],r[3]);
    // cp[2].CrossProduct(r[2],r[0]);
    // cp[3].CrossProduct(l[2],l[3]);
    // cp[4].CrossProduct(l[0],l[3]);
    // cp[5].CrossProduct(l[2],l[0]);
    cp[0]  = r[2].cross(r[3]);
    cp[1]  = r[0].cross(r[3]);
    cp[2]  = r[2].cross(r[0]);
    cp[3]  = l[2].cross(l[3]);
    cp[4]  = l[0].cross(l[3]);
    cp[5]  = l[2].cross(l[0]);
    
    // det[0]=DotProduct(r[0],cp[0]);
    // det[1]=DotProduct(r[1],cp[1]);
    // det[2]=DotProduct(r[1],cp[2]);
    // det[3]=DotProduct(l[0],cp[3]);
    // det[4]=DotProduct(l[1],cp[4]);
    // det[5]=DotProduct(l[1],cp[5]);
    det[0] = r[0].dot(cp[0]); 
    det[1] = r[1].dot(cp[1]); 
    det[2] = r[1].dot(cp[2]); 
    det[3] = l[0].dot(cp[3]); 
    det[4] = l[1].dot(cp[4]); 
    det[5] = l[1].dot(cp[5]); 
        
    // col[0].ScalarMultiply(r[1],det[0]);
    // col[1].ScalarMultiply(r[2],det[1]);
    // col[2].ScalarMultiply(r[3],det[2]);
    col[0] = r[1].multiply(det[0]);
    col[1] = r[2].multiply(det[1]);
    col[2] = r[3].multiply(det[2]);
    
    // pv[0].CrossProduct(l[2], l[3]);
    // pv[1].CrossProduct(l[3], l[1]);
    // pv[2].CrossProduct(l[1], l[2]);
    pv[0] = l[2].cross(l[3]);
    pv[1] = l[3].cross(l[1]);
    pv[2] = l[1].cross(l[2]);
    
    if((det[0]!=0.0)&&(det[1]!=0.0)&&(det[2]!=0.0) && 
        (det[3]!=0.0)&&(det[4]!=0.0)&&(det[5]!=0.0)){
    
      // Non-degenerate case
      // lig[0].ScalarMultiply(pv[0],1.0/det[3]);
      // lig[1].ScalarMultiply(pv[1],1.0/det[4]);
      // lig[2].ScalarMultiply(pv[2],1.0/det[5]);
      lig[0] = pv[0].multiply(1.0/det[3]);
      lig[1] = pv[1].multiply(1.0/det[4]);
      lig[2] = pv[2].multiply(1.0/det[5]);
            
      // H1inv.array[0][0]=lig[0].x;
      // H1inv.array[0][1]=lig[0].y;
      // H1inv.array[0][2]=lig[0].z;
      // H1inv.array[1][0]=lig[1].x;
      // H1inv.array[1][1]=lig[1].y;
      // H1inv.array[1][2]=lig[1].z;
      // H1inv.array[2][0]=lig[2].x;
      // H1inv.array[2][1]=lig[2].y;
      // H1inv.array[2][2]=lig[2].z;
      H1inv.elements[0][0] = lig[0].elements[0];
      H1inv.elements[0][1] = lig[0].elements[1];
      H1inv.elements[0][2] = lig[0].elements[2];
      H1inv.elements[1][0] = lig[1].elements[0];
      H1inv.elements[1][1] = lig[1].elements[1];
      H1inv.elements[1][2] = lig[1].elements[2];
      H1inv.elements[2][0] = lig[2].elements[0];
      H1inv.elements[2][1] = lig[2].elements[1];
      H1inv.elements[2][2] = lig[2].elements[2];
    
      // H2.array[0][0]=col[0].x;
      // H2.array[1][0]=col[0].y;
      // H2.array[2][0]=col[0].z;
      // H2.array[0][1]=col[1].x;
      // H2.array[1][1]=col[1].y;
      // H2.array[2][1]=col[1].z;
      // H2.array[0][2]=col[2].x;
      // H2.array[1][2]=col[2].y;
      // H2.array[2][2]=col[2].z;
      H2.elements[0][0] = col[0].elements[0];
      H2.elements[1][0] = col[0].elements[1];
      H2.elements[2][0] = col[0].elements[2];
      H2.elements[0][1] = col[1].elements[0];
      H2.elements[1][1] = col[1].elements[1];
      H2.elements[2][1] = col[1].elements[2];
      H2.elements[0][2] = col[2].elements[0];
      H2.elements[1][2] = col[2].elements[1];
      H2.elements[2][2] = col[2].elements[2];
    
      // MatrixMultiply(H2,H1inv,tmp);
      tmp = H2.multiply(H1inv);
      
      // Normalize...
      // for(i=0;i<3;i++){
      //   for(j=0;j<3;j++){
      //     H.array[i][j]=(tmp.array[i][j]/tmp.array[2][2]);
      //   }
      // }
      for(i=0;i<3;i++){
        for(j=0;j<3;j++){
          H.elements[i][j]=(tmp.elements[i][j]/tmp.elements[2][2]);
        }
      }  
    }
    return H;
  }
  // --
  function addFrame(){
    var dataurl = canvas[3].toDataURL('image/webp');
    $(frames).append("<div class='fimg' onclick='luunrcam.fimg_click(this);'><img src='"+dataurl+"'></div>");
    //$("#lastFrameOverlay").html("<img class='filter_purple' src='"+canvas[3].toDataURL('image/png')+"'>");
    $("#lastFrameOverlay").html("<img class='' src='"+dataurl+"'>");
  }
  var AUTO_TIME = 500;
  var lastAdd   = 0;
  var lastFrame = 0;
  var speedupTimeout = null;
  function nicelyAddFrame(){
    var nowTime  = new Date().getTime();
    var nowFrame = frameCount;
    if((nowTime-lastAdd) > AUTO_TIME && lastFrame !== nowFrame){
      lastAdd   = nowTime;
      lastFrame = nowFrame;
      addFrame();
      if(speedupTimeout) clearTimeout(speedupTimeout);
      speedup = true;
      speedupTimeout = setTimeout(function(){
        speedup = false;
      }, AUTO_TIME*2);
    }
  }
  var autoAddInterval = null;
  function toggleAutoAdd(el){
    if(autoAddInterval){
      clearInterval(autoAddInterval);
      autoAddInterval = null;
      if(el){
        $(el).removeClass("on");
      }
    }else{
      autoAddInterval = setInterval(function(){
        nicelyAddFrame();
      }, 100);
      if(el){
        $(el).addClass("on");
      }
    }
  }
  function toggleLastFrameOverlay(el){
    if($("#lastFrameOverlay").is(":visible")){
      $("#lastFrameOverlay").hide();
      if(el){
        $(el).removeClass("on");
      }
    }else{
      $("#lastFrameOverlay").show();
      if(el){
        $(el).addClass("on");
      }
    }
  }
  function toggleAlign(el){
    if(useHomography){
      useHomography = false;
      HOMOGRAPHY_MATRIX = new Matrix.I(3);
      ctx[1].drawImage(video, 0, 0, VIDEO_W/DIV, VIDEO_H/DIV);
      if(el){
        $(el).removeClass("on");
      }
    }else{
      computeHomography();
      if(el){
        $(el).addClass("on");
      }
    }
  }
  function toggleBGSubtraction(el){
    if(el){
      if($(el).hasClass("on")){
        $(el).removeClass("on");
        clearBG();
      }else{
        $(el).addClass("on");
        setCurrentAsBG();
      }
    }
  }
  function clear(){
    if(confirm("CLEAR your entire video?")){
      $(frames).html("");
      $("#lastFrameOverlay").html("");
      $("#playImg").attr("src", "");
    }
  }
  function fimg_click(el){
    $(el).remove();
  }
  function save(){
    var t = new Date().getTime();
    var encoder = new Whammy.Video(OUTPUT_FPS, 1);
    $(frames).find(".fimg img").each(function(index, el){
      encoder.add($(el).attr("src")); 
    });
    console.log(encoder); 
    var output = encoder.compile(); 
    console.log(output, new Date().getTime()-t);
    if (window.saveAs) {
      var d = new Date();
      window.saveAs(output, "stopmotion_"+(d.getTime()/1000).toFixed(0)+".webm");
    }else{
      var url = (window.webkitURL || window.URL).createObjectURL(output);
      window.open(url, "_blank");
    }
    //navigator.saveBlob(output, "moo.webm");
    
  }
  function setOutputFPSFromInput(el, dEl){
    console.log("todo. change framerate");
    OUTPUT_FPS = $(el).val() || 5;
  }
  function clickCornerAdjust(e, el){
    var elW = $(el).width();
    var elH = $(el).height();
    var oX = e.offsetX;
    var oY = e.offsetY;
    var perX = 1.0*oX/elW;
    var perY = 1.0*oY/elH;
    var newX = Math.floor(perX*VIDEO_W/DIV);
    var newY = Math.floor(perY*VIDEO_H/DIV);
    var newI = newX+newY*VIDEO_W/DIV;
    console.log(e, elW, elH, oX, oY, perX, perY);
    console.log("corner adjust...");
    var newMaxI = lastHomographyMaxI;
    if(perX < 0.5){
      if(perY < 0.5){
        newMaxI[0] = newI;
      }else{
        newMaxI[3] = newI;
      }
    }else{
      if(perY < 0.5){
        newMaxI[1] = newI;
      }else{
        newMaxI[2] = newI;
      }
    }
    computeHomography(newMaxI);
  }
  function framesRecorded(){
    return $(frames).find(".fimg img").size();
  }
  */
  
  return {
    init: init,
    getImage: getImage,
    //computeHomography: computeHomography,
    //setCurrentAsBG: setCurrentAsBG,
    //clearBG: clearBG,
    //addFrame: addFrame,
    //nicelyAddFrame: nicelyAddFrame,
    //toggleAutoAdd: toggleAutoAdd,
    //toggleLastFrameOverlay: toggleLastFrameOverlay,
    //toggleBGSubtraction: toggleBGSubtraction,
    //fimg_click: fimg_click,
    //save: save,
    //clear: clear,
    //clickCornerAdjust: clickCornerAdjust,
    //toggleAlign: toggleAlign,
    //setOutputFPSFromInput: setOutputFPSFromInput,
    //framesRecorded: framesRecorded,
    fps: function(){return OUTPUT_FPS;}
  };
  
});