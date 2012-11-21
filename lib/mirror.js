// mirror.js
//
// Mirror existing git repos.
//

var util = require('util'),
    url = require('url');

module.exports = function (app) {
  var router = app.router;

  app.repos.mirror = mirror;
  app.repos.syncMirror = syncMirror;

  app.router.addRoute('/:user/:repo/mirror', function (req, res, next) {
    if (req.method !== 'POST') {
      // Users should POST to this endpoint.
      res.statusCode = 405;
      res.setHeader('content-type': 'application/json');
      return res.end(JSON.stringify({
        code: 405,
        error: 'Method Not Allowed',
        message: 'Requests to mirror a repo should POST, not ' + req.method + '!'
      }, true, 2));
    }

    var payload = '', remote, repo;

    req.on('data', function (data) {
      payload += data.toString();
    });

    req.on('end', function () {
      try {
        remote = JSON.parse(payload).remote;
      }
      catch (err) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify({
          code: 400,
          error: 'Bad Request',
          message: 'POST body should be valid JSON with a "remote" property'
        }, true, 2));
      }

      repo = url.parse(remote).path.substr(1);

      app.repos.mirror(remote, repo, function (err) {
        if (err) {
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({
            code: 500,
            error: 'Internal Server Error',
            message: err.message || 'it is a mystery :('
          }, true, 2));

          app.log.error(err.message);
          err.stack.split('\n').forEach(function (l) {
            app.log.error(l);
          });
          return;
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify({
          code: 200,
          ok: true,
          message: util.format('Congrats, mirroring %s worked!', remote)
        }, true, 2));
      });
    });
  });
};

// adopted from pushover.create
function mirror(remote, repo, cb) {
  var self = this,
      cwd = process.cwd();

  if (typeof cb !== 'function') {
    cb = function () {};
  }

  if (/\.\.|^\//.test(repo)) {
    return cb(new Error('invalid repo name'));
  }

  self.exists(repo, function (ex) {
    if (!ex) {
      self.mkdir(repo, next);
    }
    else {
      next();
    }
  });
    
  function next (err) {
    if (err) {
      return cb(err);
    }
        
    var dir = path.join(self.repoDir, repo),
        ps = spawn('git', [ 'clone', '--mirror', remote, dir ]),
        err = '';

    ps.stderr.on('data', function (buf) { err += buf });
        
    onexit(ps, function (code) {
      if (code) {
        cb(new Error(err || 'git exited with code ' + code + 'on mirror'));
      }
      else {
        cb(null);
      }
    });
  }
};

function syncMirror(repo) {
  var self = this,
      cwd = process.cwd();

  if (typeof cb !== 'function') {
    cb = function () {};
  }

  if (/\.\.|^\//.test(repo)) {
    return cb(new Error('invalid repo name'));
  }

  self.exists(repo, function (ex) {
    if (!ex) {
       cb(new Error('can\'t sync a nonexistent mirror!'));
    }
    else {
      fetch();
    }
  });
    
  function fetch(err) {
    if (err) {
      return cb(err);
    }
        
    var dir = path.join(self.repoDir, repo),
        ps = spawn('git', [ 'fetch', '--all', dir ]),
        err = '';

    ps.stderr.on('data', function (buf) { err += buf });
        
    onexit(ps, function (code) {
      if (code) {
        cb(new Error(err || 'git exited with code ' + code + 'on fetch'));
      }
      else {
        repack();
      }
    });
  }

  function repack() {
    var dir = path.join(self.repoDir, repo),
        ps = spawn('git', [ 'repack', dir ]),
        err = '';

    ps.stderr.on('data', function (buf) { err += buf });
        
    onexit(ps, function (code) {
      if (code) {
        cb(new Error(err || 'git exited with code ' + code + 'on repack'));
      }
      else {
        cb(null);
      }
    });
  }
};

function onexit(ps, cb) {
  var pending = 3,
      code,
      sig;
    
  function onend () {
    if (--pending === 0) {
      cb(code, sig);
    }
  }

  ps.on('exit', function (c, s) {
    code = c;
    sig = s;
  });
  ps.on('exit', onend);
  ps.stdout.on('end', onend);
  ps.stderr.on('end', onend);
};
