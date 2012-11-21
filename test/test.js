var path = require('path'),
    util = require('util'),
    spawn = require('child_process').spawn;

var test = require('tap').test,
    request = require('request');

function tests(t, done) {
  request('http://localhost:31337', function (err, res, body) {
    t.assert(!err, 'req `/`: no error');
    t.equal(res.statusCode, 200, 'req `/`: status 200');
    done();
  });
}

test('piston integration tests', function (t) {
  var piston;

  // start piston server, run tests, then kill it.
  setup(function (err) {
    if (err) {
      t.fail(err);
      td();
    }
    tests(t, td);

    function td() {
      tearDown(function (err) {
        if (err) {
          t.fail(err);
        }
        t.end();
      });
    }
  });

  function setup(cb) {
    piston = spawn(path.resolve(__dirname, '../bin/piston'));
    piston.stdout.on('data', pistonLog);
    piston.stderr.on('data', pistonLog);

    function pistonLog(data) {
      process.stderr.write(data.toString().split('\n').map(function (l) {
        return (l.length ? '# ' : '') + l;
      }).join('\n'));
    }

    piston.on('exit', badExit);

    piston.stdout.on('data', function (data) {
      if (data.toString().match('listening')) {
        cb();
      }
    });
  }

  function tearDown(cb) {
    piston.removeListener('exit', badExit);
    piston.once('exit', function () {
      cb();
    });
    piston.kill();
  }

  function badExit(code) {
    t.fail(code);
    t.end();
  }
});
