const Logger = require('./logger');
const http = require('http')

const logger = new Logger();
const server = http.createServer((request, response) => {
    if (request.url === "/") {
        response.write('Home page');
        response.end();
    }
});

server.listen(3000)

console.log("listening on port 3000...")

logger.on('messageLogged', (args) => {
    console.log("listener called", args);
})

// raise an event
logger.log("Hello world");