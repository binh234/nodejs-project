const path = require("path");
const express = require("express");
const WebSocket = require("ws");
const Joi = require("joi");
const cv = require("opencv4nodejs");
require("dotenv/config");

const app = express();
app.use(express.json());

const WS_PORT = 8888;
const HTTP_PORT = 8000;

const wsServer = new WebSocket.Server({ port: WS_PORT }, () =>
    console.log(`WS Server is listening at ${WS_PORT}`)
);

const cam = new cv.VideoCapture(0);


// console.log(videoStream.read());
var clients = {};
var isCamOpen = false;

var frameCallback = function(image) {
    var frame = {
        type: "frame",
        frame: image
    };
    var data = JSON.stringify(frame);
    for (var index in clients) {
        clients[index].send(data);
    }
};

var disconnectClient = function(index) {
    delete clients[index];
    if (Object.keys(clients).length == 0) {
        console.log("No Clients, Closing Camera");
        isCamOpen = false;
    }
};

var connectClient = function(ws) {
    var index = "" + new Date().getTime();
    clients[index] = ws;
    return index;
};

wsServer.on('connection', function(ws) {
    var disconnected = false;
    var index = connectClient(ws);
    if (!isCamOpen) {
        isCamOpen = true;
    }

    ws.on('close', function() {
        disconnectClient(index);
    });

    ws.on('open', function() {
        console.log("Opened");
    });

    ws.on('message', function(message) {

        switch (message) {
            case "close":
                {
                    disconnectClient(index);
                }
                break;
            case "size":
                {
                    var width = cam.get(cv.CAP_PROP_FRAME_WIDTH);
                    var height = cam.get(cv.CAP_PROP_FRAME_HEIGHT);

                    ws.send(JSON.stringify({
                        type: "size",
                        width: width,
                        height: height
                    }));
                }
                break;
        }
    });
});

setInterval(() => {
    if (isCamOpen) {
        const frame = cam.read();
        const image = cv.imencode(".jpg", frame).toString('base64');
        frameCallback(image);
    }
})

app.get("", (req, res) =>
    res.sendFile(path.resolve(__dirname, "./index.html"))
);
app.get("/client", (req, res) =>
    res.sendFile(path.resolve(__dirname, "./client.html"))
);
app.get("/client2", (req, res) =>
    res.sendFile(path.resolve(__dirname, "./client.html"))
);
app.listen(HTTP_PORT, () =>
    console.log(`HTTP server listening at ${HTTP_PORT}`)
);