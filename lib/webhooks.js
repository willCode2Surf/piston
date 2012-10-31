// webhooks.js
//
// Route for triggering git pulls from github and services that implement
// an analogous post hook api.
//

var hubhook = require('hubhook')();

module.exports = function (app) {
  var router = app.router;

  router.addRoute('/webhooks/pull', function (req, res, next) {
    if (req.method !== 'POST') {
      // Users should POST to this endpoint.
      res.statusCode = 405;
      res.setHeader('content-type': 'application/json');
      return res.end(JSON.stringify({
        code: 405,
        error: 'Method Not Allowed',
        message: 'Webhook requests should POST, not ' + req.method + '!'
      }, true, 2));
    }
    hubhook.handle(req, res);
  });

  hubhook.on('payload', function (payload) {
    app.repos.pull(payload, function (err) {
      if (err) {
        // TODO: something smarter?
        app.log.error(err.message);
        err.stack.split('\n').forEach(function (l) {
          app.log.error(l);
        });
      }
    });
  });
};
