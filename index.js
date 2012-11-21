var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    http = require('http'),
    crypto = require('crypto');

var pushover = require('pushover'),
    hubhook = require('hubhook')(),
    minilog = require('minilog'),
    mkdirp = require('mkdirp');

require('colors');

// Logging. Pretty npm-style terminal output for now.
// minilog is flexible since it's Just Streams.
var log = minilog('piston');
minilog
  .pipe(minilog.backends.nodeConsole)
  .format(minilog.backends.nodeConsole.formatNpm)
;

// pretty-print uncaught exceptions
process.on('uncaughtException', function (err) {
  log.error('☠☠☠  ' + 'FLAGRANT SYSTEM ERROR'.red + ' ☠☠☠');

  if (err.code) {
    log.error('CODE: ' + err.code);
  }

  log.error(err.message);
  err.stack.split('\n').forEach(function (l) {
    log.error(l);
  });

  process.exit(1);
});

var router = require('./lib/router')();

// TODO: make repoDir configurable
var repoDir = path.resolve('.', 'repos'),
    repos = pushover(repoDir, {
      autoCreate: true,
      checkout: false
    });

mkdirp(repoDir, function (err) {
  if (err) {
    throw err;
  }
});

var app = function (req, res) {
  log.info(util.format(
    '-> %s %s', req.method, req.url
  ));

  // ripped from connect
  var icon;
  if ('/favicon.ico' == req.url) {
    if (icon) {
      res.writeHead(200, icon.headers);
      res.end(icon.body);
    }
    else {
      return fs.readFile('./favicon.png', function (err, buff) {
        if (err) {
          return next(err);
        }

        icon = {
          headers: {
            'Content-Type': 'image/x-icon',
            'Content-Length': buff.length,
            'ETag': '"' +
              crypto
                .createHash('md5')
                .update(buff.toString())
                .digest('hex') + '"',
            'Cache-Control': 'public, max-age=86400'
          },
          body: buff
        };
        res.writeHead(200, icon.headers);
        return res.end(icon.body);
      });
    }
  }

  router(req, res, next);

  function next(err) {
    if (err) {

      // Return a 500. We aren't expecting any otherwise
      // handle-able errors.
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({
        code: 500,
        error: 'Internal System Error',
        message: err instanceof Error ? err.message : String(error)
      }, true, 2));

      // Log the error so we at least know about it
      log.error(err.message);
      err.stack.split('\n').forEach(function (l) {
        log.error(l);
      });

      return;
    }

    repos.handle(req, res);
  };
};

app.router = router;
app.repos = repos;
app.log = log;
app.use = use;

function use(lib) {
  log.info(util.format('(using ' + '%s'.cyan + ')', lib));
  require(lib)(this);
}

// Call our extra stuff
//app.use('./lib/users'); // should piston have a sense of users?
app.use('./lib/repos'); // TODO: Additional API calls (DELETE, ????)
app.use('./lib/webhooks'); // github-style POST hooks (for gh sync)

module.exports = app;
