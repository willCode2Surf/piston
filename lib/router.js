// router.js
//
// A thin wrapper around the "routes" library to just act like a
// friggin' middleware already. ;) Calls the route fxn w/ "route" as the
// context, then your normal middleware args.
//
// Why not Express, you ask? Express doesn't have a way, afaik, to
// do "middlewares" *after* the built-in router. Which needs to happen,
// since pushover doesn't have a "next" route.
//

var Router = require('routes').Router;

module.exports = function (opts) {
  opts = opts || {};

  var router = new Router;

  var handler = function (req, res, next) {
    var route = router.match(req.url);

    if (route && route.fn) {
      return route.fn.call(route, req, res, next);
    }

    next();
  };

  handler.addRoute = router.addRoute.bind(router);

  return handler;

};
