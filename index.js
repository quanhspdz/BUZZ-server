var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var fs = require("fs");
var arrayUsername = [];
var arrayMessage = [];
var arrayPassword = [];

server.listen(process.env.PORT || 3000);

console.log("server is running");

//listen new connection
io.sockets.on('connection', function(socket) {
    console.log("a device is connected to server");
    
    //listen user sign up
    socket.on('client-register-user', function(userName) {
        if (arrayUsername.indexOf(userName) == -1) {
            //push username & password
            arrayUsername.push(userName);
            console.log("New user: " + userName);
            socket.on('client-register-user-password', function(password) {
                arrayPassword.push(password);
                fs.appendFile('username.txt', '\n' + userName, (err) => {
                    if (err) throw err;
                    console.log('saved username');
                });
                fs.appendFile('password.txt', '\n' + password, (err) => {
                    if (err) throw err;
                    console.log('saved password');
                });
                //send to client: register success
                socket.emit('server-send-register-result', {result : "0"});
            });
        } else {
            //send to client: user name has already taken
            console.log(userName + " has already taken by someone!");
            socket.emit('server-send-register-result', {result : "1"});
        }
    });

    //listen when client request user list
    socket.on('client-request-user-list', function(data) {
        if (data == "now") {
            //send new user list to client
            io.sockets.emit('server-send-user-list', {
                userList : arrayUsername
            });
        }
    });

    //listen when client request message list
    socket.on('client-request-message-list', function(data) {
        io.sockets.emit('server-send-message-list', {
            messageList : arrayMessage
        })
    });

    //listen when client send new message
    socket.on('client-send-message', function(message) {
        console.log(message);
        arrayMessage.push(message);
    });

    var result = "0" // fail : 0, success : 1
    //listen when client send user name and password to login
    socket.on('client-send-login-username', function(username) {
        if (arrayUsername.indexOf(username) != -1) {
            //user name existed -> listen to password
            console.log("username ok")
            socket.on('client-send-login-password', function(password) {
                //check password correct or not
                if(arrayPassword[arrayUsername.indexOf(username)] == password) {
                    //password correct
                    console.log("password ok");
                    result = "1"
                    //send client login status
                    sendLoginResult(socket, result);
                } else {
                    console.log("password no");
                    result = "0";
                    //send client login status
                    sendLoginResult(socket, result);
                }
            });
        } else {
            //user name did not exist
            console.log("username no");
            result = "0";
            //send client login status
            sendLoginResult(socket, result);
        }
    });

});

function sendLoginResult(socket, result) {
    //send client login status
    socket.emit('server-send-login-result', {
        status : result
    });
}