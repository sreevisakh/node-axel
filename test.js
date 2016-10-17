var Axel = require('./lib/app');

let axel = new Axel({
    connections: 4
});
let axelEvents = axel.download('http://getstatuscode.com/502');
axel.promise.then((data) => {
    console.log('Promise Resolved', data)
}, error => {
    console.log('Promise Rejected', error);
});
axelEvents.on('progress', function(data) {
    console.log('Progress Event:', data)
})
axelEvents.on('error', function(data) {
    console.log('Progress Event:', data)
})
axelEvents.on('close', function() {
    console.log('Finished');
})
axelEvents.on('error', function(error) {
    console.log(error);
})