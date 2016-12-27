var client = require('./index.js')({
  host      : "127.0.0.1",
  namespace : "local_",
  retryTime : 1000,
  password  : "",
  log: function(msg) {
    console.log(msg)
  },
  error: function(err) {
    console.error(err)
  }
})


client.run(function* () {

  console.log('redis set:')
  for (var i = 0; i < 4; i++) {
    console.log(yield client.set('key_' + i, 'value_' + i));
  }
  console.log('redis get:')
  console.log(yield client.get('key_1'))
  console.log('redis keys:')
  console.log(yield client.keys())
  console.log('redis del:')
  console.log(yield client.del('key_1'))
  console.log('redis keys:')
  console.log(yield client.keys())
  console.log('redis clear:')
  console.log(yield client.clear())
  console.log('redis keys:')
  console.log(yield client.keys())

})

/*
outputs:

redis set:
redis ready.
retry
OK
OK
OK
OK
redis get:
value_1
redis keys:
[ 'local_temphtml_key_2',
  'local_temphtml_key_1',
  'local_temphtml_key_0',
  'local_temphtml_key_3' ]
redis del:
1
redis keys:
[ 'local_temphtml_key_2',
  'local_temphtml_key_0',
  'local_temphtml_key_3' ]
redis clear:
OK
redis keys:
[]

*/
