'use strict';
require('dotenv').config();
require('./server/config');
require('./server/mongoose-start');
const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressJwt = require('express-jwt');
var passport = require('passport');
const routes = require('./server/routes');

app.use(bodyParser());
app.use(cookieParser());
// Always attempt to authorise JWT and attach to req.auth
app.use(expressJwt({secret: process.env.jwtKey, requestProperty: 'auth'}));

app.use(passport.initialize());


app.use(express.static(path.join(__dirname, 'dist')));

const port = process.env.PORT || '3000';
app.set('port', port);

routes(app);

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.post('*', function(req, res) {
  res.status(404).json({message: "Route not found."});
});

const server = http.createServer(app);

server.listen(port, function () {
  console.log(`Running on localhost:${port}`);
});
