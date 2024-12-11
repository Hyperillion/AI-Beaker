const express = require("express");
const fs = require("fs");
const https = require("https");
const socket = require("socket.io");

// Express app
const app = express();

app.use(express.static("public"));
app.get("/", function (request, response) {
    response.sendFile(__dirname + "/views/index.html");
});

app.get("/beaker", function (request, response) {
    response.sendFile(__dirname + "/views/beaker.html");
});

// HTTPS Server
const port = process.env.PORT || 1145;

// Path to your SSL certificate and key
const options = {
    key: fs.readFileSync("C:/Users/AndyYe/private.key"), // Replace with the path to your private key
    cert: fs.readFileSync("C:/Users/AndyYe/certificate.crt") // Replace with the path to your certificate
};

const server = https.createServer(options, app);

server.listen(port, function () {
    console.log("Server is running on HTTPS: https://localhost:" + port);
});

// socket.io
const io = socket(server);

io.on("connection", newConnection);

function newConnection(socket) {
    console.log("New Connection - ID: " + socket.id);

    // receive
    socket.on("connection_name", receive);

    function receive(data) {
        console.log(data);
        socket.broadcast.emit("connection_name", data);
    }
}
