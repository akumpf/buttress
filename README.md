Buttress for Node.js
=============

NOTE: Buttress is currently experimental -- it will change often. Use at your own risk!

Supportive rapid prototyping library for NodeJS that provides both server and client helpers.

SERVER-SIDE
===

CLIENT-SIDE
===

Buttress includes a handful of helpful javsacript modules and assets to make life easier. It also provides counter-parts to some of the server-side capabilities.

Providing access to the client-side files is simple via a pass-through in your node server app.js. Something like this is usually placed near the end of your code:

    app.use("/_lib", express.static(buttress.clientLibDir));

rtpipe
---



