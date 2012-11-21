// repos.js
//
// Routes for extended git repo management.
// TODO: actually write.
//

var rimraf = require('rimraf');

module.exports = function (app) {
  // Add the D to CRUD (create/update and read handled by pushover)
  app.router.addRoute('/:user/:repo', function (req, res, next) {
    if (req.method == 'DELETE') {
      // TODO: Actually enable deleting repos
      res.statusCode = 501;
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({
        code: 501,
        error: 'Not Implemented',
        message: 'Deleting repos isn\'t implemented yet.'
      }, true, 2));
    }
    else {
      next();
    }
  });

  // TODO: serve list of repos off '/'
};
