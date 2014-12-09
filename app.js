var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var names = require('./names');
var baconIpsum = require('baconipsum');
var rwc = require('random-weighted-choice');
var _ = require('lodash');

var smileys = [
  {id:":)",weight:100},
  {id:":-)",weight:20},
  {id:":-/",weight:10},
  {id:"¯\\_(ツ)_/¯",weight:5}
];

var ipsum = function(){
  var n = Math.floor(Math.random()*10+5);
  return baconIpsum(n).replace(/\./g, function(){
    if(Math.random()<0.1){
      return '?';
    }else if(Math.random()<0.05){
      return '!';
    }
    return '.';
  }) + ' '+(Math.random()<0.2?rwc(smileys):'');
}

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};

app.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});


shuffle(names);

var messages = [],
  users = [{
    name: "Ryan"
  }],
  userEvents = [],
  messagesRunning = false;

function makeMessage(){
  var content = ipsum(),
    user = randUser();
  return {
    user: user,
    content: content,
    when: +new Date()
  }
}

function randUser(){
  return users[Math.floor(Math.random()*users.length)];
}

function addUser(){
  if(!names.length) return;
  var username = names.pop(),
    user = {
      name: username,
      joined: +new Date()
    };
  users.push(user);
  userEvents.push({
    type: 'useradd',
    user: user,
    when: user.joined
  });
  setTimeout(addUser, Math.random()*15e3+10e3);
}

function nextMessage(){
  messages.push(makeMessage());
  setTimeout(nextMessage, Math.random()*5e3+7e3);
}

function startMessages(){
  if(messagesRunning) return;
  messagesRunning = true;
  addUser();
  nextMessage();
}

app.get('/api/messages', function(req, res){
  var since = +req.query.since || 0;
  startMessages();
  _.where(users,{name:'Ryan'},function(u){u.joined = +new Date()});
  userEvents.push({type:'useradd',user:_.where(users,{name:'Ryan'}),when:+new Date()});
  res.json(messages.filter(function(message){return message.when>since}));
});

app.get('/api/user-events', function(req, res){
  var since = +req.query.since || 0;
  res.json(userEvents.filter(function(e){return e.when>since}));
});

app.post('/api/message', function(req, res){
  var text = req.data,
    message = {when: +new Date(), content: text};
  messages.push(message);
  res.send('ok');
});

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
