var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    http = require('http');

var pushover = require('pushover'),
    pullover = require('pullover'),
    hubhook = require('hubhook')(),
    minilog = require('minilog');

// Logging. Pretty npm-style terminal output for now.
// minilog is flexible since it's Just Streams.
var log = minilog('piston');
minilog
  .pipe(minilog.backends.nodeConsole)
  .format(minilog.backends.nodeConsole.formatNpm)
;

var router = require('./lib/router')();

// TODO: make repoDir configurable
var repos = pushover(path.resolve('.', 'repos'), {
      autoCreate: true,
      checkout: false
    }),
    pull = pullover(repos);

var app = function (req, res) {
  log.info(util.format(
    '-> %s %s', req.method, req.url
  ));
  router(req, res, function (err) {
    if (err) {

      // Return a 500. We aren't expecting any otherwise
      // handle-able errors.
      res.statusCode = 500;
      res.setHeader('content-type': 'application/json');
      res.end(JSON.stringify({
        code: 500,
        error: 'Internal System Error',
        message: error.message
      }, true, 2));

      // Log the error so we at least know about it
      log.error(err.message);
      err.stack.split('\n').forEach(function (l) {
        log.error(l);
      });

      return;
    }

    repos.handle(req, res);
  });
};

app.router = router;
app.repos = repos;
app.repos.pull = pull.pull.bind(pull);
app.log = log;

// Call our extra stuff
//require('./lib/users')(app); // should piston have a sense of users?
                               // where does this come from?
require('./lib/webhooks')(app); // github-style POST hooks (for gh sync)
require('./lib/repos')(app); // TODO: Additional API calls (DELETE, ????)

module.exports = app;
