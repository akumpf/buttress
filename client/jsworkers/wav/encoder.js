// 
// see: https://ccrma.stanford.edu/courses/422/projects/WaveFormat/ for spec details.
// --

function interleave(chanData){
  var chans  = chanData.length;
  if(chans === 1) return chanData[0];
  var l0     = chanData[0].length;
  var length = l0 * chans;
  var result = new Float32Array(length);
  // --
  var index = 0;
  var inputIndex = 0;
  for(var i=0; i<l0; i++){
    for(var c=0; c<chans; c++){
      result[i*chans+c] = chanData[c][i];
    }
  }
  console.log(result);
  return result;
}
function floatTo16BitPCM(output, offset, input){
  try{
    for (var i = 0; i < input.length; i++, offset+=2){
      var s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }catch(ex){
    console.warn("float to 16BitPM Err: i", i, ", offset", offset);
    console.log(ex);
  }
}
function wrTxt(view, offset, string){
  for (var i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}  
// --
self.onmessage = function(e) {
  var chans, len, buffer, dv;
  switch (e.data.cmd) {
  case 'init':
    e.data.config   = e.data.config||{};
    chans           = e.data.config.channels || 1;
    len             = e.data.config.len || 0;
    if(!len) return console.warn("wav: no len specified.");
    var samplerate  =  e.data.config.in_samplerate || 44100;
    // --
    buffer  = new ArrayBuffer(44); // + samples.length * 2); // 44 + PCM points * 2
    dv      = new DataView(buffer);
    // -- header 
    wrTxt(dv, 0, 'RIFF');   // RIFF
    dv.setUint32(4, 36 + 2*len*chans, true); // 36 + data byte length
    wrTxt(dv, 8, 'WAVE');   // RIFF type
    // -- chunk 1
    wrTxt(dv, 12, 'fmt ');  // chunk id
    dv.setUint32(16, 16, true);   // subchunk1size (16 for PCM)
    dv.setUint16(20, 1, true);    // 1=PCM
    dv.setUint16(22, chans, true); // num channels
    dv.setUint32(24, samplerate, true);          // samplerate
    dv.setUint32(28, samplerate * chans * 2, true); // byterate
    dv.setUint16(32, 2 * chans, true);  // block align
    dv.setUint16(34, 16, true); // bits per sample (16 = 2 bytes)
    // -- chunk 2
    wrTxt(dv, 36, 'data');         // data chunk id
    dv.setUint32(40, 2*len*chans, true); // chunk len
    // --
    self.postMessage({cmd: 'data', buf: new Uint8Array(buffer)});
    break;
  case 'encode':
    chans   = 1;
    if(e.data.buf2) chans = 2;
    len     = (e.data.buf1||[]).length;
    // --
    buffer  = new ArrayBuffer(2*len*chans); // + samples.length * 2); // 44 + PCM points * 2
    dv      = new DataView(buffer);
    // --
    var chanData;
    if(chans === 1){
      chanData = [e.data.buf1||[]];
    }else{
      chanData = [e.data.buf1||[], e.data.buf2||[]];
    }
    //console.log("wav: chans="+chans+", len="+len);
    var idata = interleave(chanData);
    //console.log("wav: idata len="+idata.length);
    floatTo16BitPCM(dv, 0, idata); 
    self.postMessage({cmd: 'data', buf: new Uint8Array(buffer)});
    break;
  case 'finish':
    self.postMessage({cmd: 'end', buf: []});
    break;
  }
};
