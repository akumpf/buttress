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
atb.enableHighAvailability(http);
// -- MAIN APP CODE --
app.get('/', function(req, res){
  res.send('Hello World');
});
// -- END OF APP -- 
app.use("/_lib", express.static(buttress.clientLibDir));
var server = app.listen(process.env.PORT||80);
// -- WHEN APP ENDS --
process.on('SIGTERM', function () {
  server.close();
  atb.onShutdown();
  return process.exit(); 
}
```

## Installation

    $ npm install buttress


## SERVER-SIDE 




## CLIENT-SIDE

Buttress includes a handful of helpful javsacript modules and assets to make life easier. It also provides counter-parts to some of the server-side capabilities.

Providing access to the client-side files is simple via a pass-through in your node server app.js. Something like this is usually placed near the end of your code:

    app.use("/_lib", express.static(buttress.clientLibDir));

rtpipe
---



