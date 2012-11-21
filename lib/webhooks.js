// webhooks.js
//
// Route for triggering git pulls from github and services that implement
// an analogous post hook api.
//

var hubhook = require('hubhook')(),
    url = require('url');

module.exports = function (app) {
  var router = app.router;

  router.addRoute('/webhooks/pull', function (req, res, next) {
    if (req.method !== 'POST') {
      // Users should POST to this endpoint.
      res.statusCode = 405;
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({
        code: 405,
        error: 'Method Not Allowed',
        message: 'Webhook requests should POST, not ' + req.method + '!'
      }, true, 2));
    }
    hubhook.handle(req, res);
  });

  hubhook.on('payload', function (payload) {

    var repo = url.parse(payload.repository.url).path.substr(1),
        remote = payload.repository.url + '.git';

    app.repos.exists(repo, function (ex) {
      if (!ex) {
        if (app.repos.autoCreate) {
          app.repos.mirror(remote, repo, sync)
        }
        else {
          cb(new Error(
            'can\'t sync a nonexistent mirror (unless autoCreate is on)'
          ));
        }
      }
      else {
        sync();
      }
    });

    function sync(err) {
      if (err) {
        return handleError(err);
      }

      app.repos.syncMirror(repo, function (err) {
        if (err) {
          return handleError(err);
        }
      });
    }

    // TODO: It would be nice if there was some real user feedback here.
    function handleError(err) {
      app.log.error(err.message);
      err.stack.split('\n').forEach(function (l) {
        app.log.error(l);
      });
    }
  });
};
