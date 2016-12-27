var redis     = require("redis")
  , thunkify  = require('thunkify')


var set = function(key, value, callback) {

  var context = this;

  var fun = function() {

    if (!context.ready) {

      setTimeout(function() {
        context.log && context.log('retry')
        fun();
      }, context.retryTime)

    } else {

      context.client.set(context.namespace + key, value, function(err, reply) {

        if (err) {
          context.ready = false;
          context.error && context.error(err);
          return fun();
        }

        context.ready = true;
        return callback(err, reply);
      });
    }
  }

  fun();
}

var keys = function(callback) {

  var context = this;

  var fun = function() {

    if (!context.ready) {

      setTimeout(function() {
        context.log && context.log('retry')
        fun();
      }, context.retryTime)

    } else {

      context.client.keys(context.namespace + '*', function(err, reply) {

        if (err) {
          context.ready = false;
          context.error && context.error(err);
          return fun();
        }
        context.ready = true;
        return callback(err, reply);
      });
    }
  }

  fun();
}

var clear = function(callback) {

  var context = this;

  var fun = function() {

    if (!context.ready) {

      setTimeout(function() {
        context.log && context.log('retry')
        fun();
      }, context.retryTime)

    } else {

      context.client.keys(context.namespace + '*', function(err, reply) {

        if (err) {
          context.ready = false;
          context.error && context.error(err);
          return fun();
        }

        var delSingleKey = function(i) {
          context.client.del(reply[i], function(err) {
            if (err) {
              context.ready = false;
              context.error && context.error(err);
              return fun();
            }

            i++;
            if (i < reply.length) {
              return delSingleKey(i)
            } else {
              context.ready = true;
              return callback(null, 'OK');
            }
          })
        }

        if (reply.length > 0) {
          delSingleKey(0)
        } else {
          context.ready = true;
          return callback(err, 'OK');
        }
      });
    }
  }

  fun();
}

var get = function(key, callback) {

  var context = this;

  var fun = function() {

    if (!context.ready) {

      setTimeout(function() {
        context.log && context.log('retry')
        fun();
      }, context.retryTime)

    } else {

      context.client.get(context.namespace + key, function(err, reply) {

        if (err) {
          context.ready = false;
          context.error && context.error(err);
          return fun();
        }

        return callback(err, reply);
      });
    }
  }

  fun();
}

var del = function(key, callback) {

  var context = this;

  var fun = function() {

    if (!context.ready) {

      setTimeout(function() {
        context.log && context.log('retry')
        fun();
      }, context.retryTime)

    } else {

      context.client.del(context.namespace + key, function(err, reply) {

        if (err) {
          context.ready = false;
          context.error && context.error(err);
          return fun();
        }

        return callback(err, reply);
      });
    }
  }

  fun();
}

module.exports = function(config) {

  var context = config;

  context.namespace = context.namespace || '';
  context.client    = redis.createClient(config);
  context.ready     = false
  context.retryTime = context.retryTime || 500;

  context.client.on("error", function (err) {
    context.error && context.error(err)
    context.ready = false;
  });

  context.client.on('ready', function() {
    context.log && context.log('redis ready.')
    context.ready = true;
  })

  return {
    set: thunkify(set.bind(context)),
    get: thunkify(get.bind(context)),
    del: thunkify(del.bind(context)),
    keys: thunkify(keys.bind(context)),
    clear: thunkify(clear.bind(context)),
    client: context.client,
    run: function (fn) {
      var gen = fn();

      function next(err, data) {
        var result = gen.next(data);
        if (result.done) return;
        result.value(next);
      }

      next();
    }
  }
}
