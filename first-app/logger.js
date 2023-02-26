const EvenEmitter = require('events');

let url = 'https://mylogger.io/log'

class Logger extends EvenEmitter {
    log = function (message) {
        console.log(message);

        this.emit('messageLogged', {id: 1, url: url});
    }
s}

module.exports = Logger;