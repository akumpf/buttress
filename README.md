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






