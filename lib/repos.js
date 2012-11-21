// repos.js
//
// Routes for extended git repo management.
// TODO: actually write.
//

var rimraf = require('rimraf'),
    lsr = require('ls-r'),
    path = require('path');

module.exports = function (app) {
  // Add the D to CRUD (create/update and read handled by pushover)
  app.router.addRoute('/:user/:repo', function (req, res, next) {
    if (req.method == 'DELETE') {
      var dir = this.user + '/' + this.repo;
      rimraf(path.resolve(this.repoDir, dir), function (err) {
        if (err) {
          return next(err);
        }
      });

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({
        code: 200,
        ok: true,
        message: util.format(
          'Congrats, deleting /%s/%s worked!', this.user, this.repo
        ),
      }, true, 2));

    }
    else {
      next();
    }
  });

  app.router.addRoute('/', function (req, res, next) {
    var repoDir = app.repos.repoDir;
    lsr(repoDir, function (err, repos) {
      if (err) {
        return next(err);
      }

      repos = repos.map(function (r) {
        return path.relative(repoDir, r);
      }).filter(function (r) {
        return r.split('/') >= 2;
      });

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({
        code: 200,
        ok: true,
        message: 'Welcome to PISTON, an http git server!',
        repos: repos
      }, true, 2));
    });
  });

  // TODO: serve list of repos off '/'
};
