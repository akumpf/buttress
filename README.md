Buttress for Node.js
=============

*NOTE: Buttress is currently experimental -- it will change often. Use at your own risk!*

Supportive rapid prototyping library for NodeJS that provides both server and client helpers.

```js
// Get the party started...
var buttress  = require('buttress');
var atb       = buttress.atb()({}); // the AppToolBelt!
var express   = atb.express;
var _         = atb.underscore;
var app       = express();
var http      = require("http");
var httpapp   = http.createServer(app);
// --
atb.enableHighAvailability(http);   // drastically helps under load.
atb.appDefaultRoutes(app, express); // cookies,bodyparser,gzip,503-on-overload.
// -- MAIN APP CODE --

app.get('/', function(req, res){
  res.send('Hello World');
});

// -- FINALIZE AND START LISTENING -- 
app.use("/_lib", express.static(buttress.clientLibDir));
var server = app.listen(process.env.PORT||80);
// -- WHEN APP ENDS / CLOSES --
process.on('SIGTERM', function(){
  // do anything you want before the process is killed.
  // i.e. shutdown gracefully if possible.
  server.close(); 
  atb.onShutdown();
  return process.exit(); 
});
```

## Installation

    $ npm install buttress


## SERVER-SIDE 

### atb: the app toolbelt

### lessr: auto-updating less compiler

### reqjs: javascript module combiner

### rtpipe: friendlier websockets

## CLIENT-SIDE

Buttress includes a handful of helpful javsacript modules and assets to make life easier. It also provides counter-parts to some of the server-side capabilities.

Providing access to the client-side files is simple via a pass-through in your node server app.js. Something like this is usually placed near the end of your code:

    app.use("/_lib", express.static(buttress.clientLibDir));

This enables client-side webapps to see common assets and scripts in the `./_lib`  virtual folder.

Note that client-side libraries are split into 3 parts:

1. **jscore**: helpful js includes that don't depend on anything else.
2. **jsmods**: requirejs modules.
3. **jsworkers**: stand-alone webworkers for heavy tasks.


## Open Source License

All new code by akumpf is licensed as open source under the MIT License.

```
The MIT License (MIT)

Copyright (c) 2013 Adam Kumpf

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

All other open source code is licensed as indicated and included simply out of convenience. You should really go check out their work directly. It's pretty awesome.

* jQuery: https://github.com/jquery/jquery
* underscore: https://github.com/jashkenas/underscore
* d3: https://github.com/mbostock/d3
* requirejs: https://github.com/jrburke/requirejs
* less: https://github.com/less/less.js/
* lame: http://lame.sourceforge.net/
* tuna: https://github.com/Dinahmoe/tuna
* sockjs: https://github.com/sockjs
* filesaver: http://purl.eligrey.com/github/FileSaver.js
* bbq: http://benalman.com/projects/jquery-bbq-plugin/
* dsp: https://github.com/corbanbrook/dsp.js/
* linkify: http://benalman.com/code/test/js-linkify/
* markdown: https://github.com/evilstreak/markdown-js

