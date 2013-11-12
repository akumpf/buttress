Buttress for Node.js
=============

*NOTE: Buttress is currently experimental -- it will change often. Use at your own risk!*

Supportive rapid prototyping library for NodeJS that provides both server and client helpers.

## Installation

    $ npm install buttress

## Example Usage

This README assumes your project's assets are set up with the following folder structure:

```
|- app.js (main server-side node app)
|- protected (files that get compiled or compressed)
|   |- js
|   |- style
|- public (public static files server from here)
    |- js
    |   |- main.js 
    |- style
    |   |- index.css (direct, or generated from less)
    |- img
        |- favicon.png
```

On the server, `app.js` will look something like this:

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
app.use(express.static(__dirname + '/public'));
// --
var server = app.listen(process.env.PORT||80);
// -- WHEN APP ENDS / CLOSES --
process.on('SIGTERM', function(){
  // do anything you want before the process is killed (shutdown gracefully).
  server.close(); 
  return atb.onShutdown();
});
```

## SERVER-SIDE 

### atb: the app toolbelt

- **atb.express** -> passthrough to require("express").
- **atb.underscore** -> passthrough to require("underscore").
- **atb.getClientIp(req)** -> gets the IP from a request.
- **atb.getClientIpBase36(req)** -> gets the IP as Base36 from a request.
- **atb.escapeHTML(txt)** -> escapes characters that would mangle html output (&,<,>).
- **atb.appDefaultRoutes(app)** -> a handy shorthand for common express routes such as: cookies, bodyparser, gzip, and 503-on-overload.
- **atb.enableHighAvailability(http)** -> a posix util that drastically helps under load.
- **atb.onShutdown()** -> should be called when your app is given the SIGTERM to end gracefully.

### lessr: auto-updating less compiler

### reqjs: javascript module combiner

### rtpipe: friendlier websockets

## CLIENT-SIDE

Buttress includes a handful of helpful javsacript modules and assets to make life easier. It also provides counter-parts to some of the server-side capabilities.

Providing access to the client-side files is simple via a pass-through in your node server app.js. Something like this is usually placed near the end of your code:

    app.use("/_lib", express.static(buttress.clientLibDir));

This enables client-side webapps to see common assets and scripts in the `./_lib`  virtual folder.

Additionally, you'll probably want to provide a static file service for app-specific javascript, iamges, etc. in app.js like this:

    app.use(express.static(__dirname + '/public'));

**Ok, now on to the code that the client actually sees!**

Note that client-side libraries are split into 3 parts:

1. **jscore**: helpful js includes that don't depend on anything else.
2. **jsmods**: requirejs modules.
3. **jsworkers**: stand-alone webworkers for heavy tasks.

Buttress is designed to make the client-side html simple and scalable. Here's a template for a site's `index.html` as a starting point (with lots of common things you'll probably want, like app description, etc).

```html
<!DOCTYPE html> 
<html lang="en-US" dir="ltr">
  <head>
    <meta charset='utf-8' />
    <!-- title -->
    <title>APP_TITLE_HERE</title>
    <meta property="og:site_name" content="APP_TITLE_HERE" />
    <!-- desc -->
    <meta name="description"  content="APP_DESCRIPTION_HERE" id='pageDescription'>
    <meta property="og:title" content="APP_DESCRIPTION_HERE" id='ogTitle' />
    <!-- app icon -->
    <link rel='shortcut icon' type='image/png' href='/img/favicon.png'>
    <meta property="og:image" content="APP_URL_HERE/img/favicon.png" />
    <!-- viewport / mobile (no zooming) -->
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <!-- style -->
    <link href="/style/index.css" rel="stylesheet" type="text/css" />
    <!-- javascript from buttress via '_lib' -->
    <script src='/_lib/jscore/jquery.js'></script>
    <script src='/_lib/jscore/underscore.js'></script>
    <script src='/_lib/jscore/init_browser.js'></script> 
    <script src='/_lib/jscore/require.js'></script> 
    <!-- app code -->
    <script>
      requirejs.config({baseUrl: '/', paths: {main: "js/main"}});
      require(["main"],function(){});
    </script> 
  </head>
  <body>
  
    APP_HTML_HERE
    
  </body>
</html>
```

And `js/main.js` will look something like this:

```js
// basic requireJS setup. library module and local project module loading...
define(["_lib/jsmods/linkify"], 
function(linkify){
  var exports = {};
  var main    = exports;
  // --
  // make things accessible to the outside world 
  // by adding them to 'exports'
  
  exports.exampleLinkifyTxt = function(txtToLinkify){
    return linkify(txtToLinkify);
  };
  
  // -- 
  function _onReady(){
    console.log("App is ready!");
  }
  $(document).ready(_onReady);
  // --
  return exports; // return the exports.
});
```

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
* addTouch: http://www.jquery4u.com/plugins/10-jquery-ipad-code-snippets-plugins

Special thanks to **The Chaos Collective (http://chaoscollective.org)** where a lot of this work started.


