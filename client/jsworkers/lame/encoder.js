// Used under LGPL, same as LAME.
// Thanks to akrennmair -> https://github.com/akrennmair/speech-to-server/blob/master/encoder.js

importScripts('./libmp3lame.js');

var mp3codec; 
self.onmessage = function(e) {
  var mp3data;
  switch (e.data.cmd) {
  case 'init':
    e.data.config = e.data.config||{};
    mp3codec = Lame.init();
    var chans = e.data.config.channels || 1; 
    Lame.set_mode(mp3codec, e.data.config.mode || (chans===1)?Lame.MONO:Lame.JOINT_STEREO);
    Lame.set_num_channels(mp3codec, chans);
    Lame.set_in_samplerate(mp3codec, e.data.config.in_samplerate || 44100);
    Lame.set_out_samplerate(mp3codec, e.data.config.out_samplerate || 44100);
    if(!e.data.config.vbr){
      Lame.set_bitrate(mp3codec, e.data.config.bitrate || 128);
    }else{
      Lame.set_VBR(mp3codec, e.data.config.vbr || 1); 
      Lame.set_VBR_min_bitrate_kbps(mp3codec, e.data.config.vbr_min || 16);
      Lame.set_VBR_max_bitrate_kbps(mp3codec, e.data.config.vbr_max || 128);
      Lame.set_VBR_q(mp3codec, e.data.config.vbr_q || 4);
    }
    Lame.init_params(mp3codec);
    self.postMessage({cmd: 'data', buf: []});
    break;
  case 'encode':
    mp3data = Lame.encode_buffer_ieee_float(mp3codec, e.data.buf1, e.data.buf2||e.data.buf1);
    self.postMessage({cmd: 'data', buf: mp3data.data});
    break;
  case 'finish':
    mp3data = Lame.encode_flush(mp3codec);
    self.postMessage({cmd: 'end', buf: mp3data.data});
    Lame.close(mp3codec);
    mp3codec = null;
    break;
  }
};
