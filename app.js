var express = require('express'),
    flash = require('connect-flash'),
    http = require('http'),
    util = require('util'),
    path = require('path'),
    models = require('./models'),
    io = require('socket.io'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    _ = require('underscore'),
    Backbone = require('backbone'),
    md5 = require('MD5');

var app = express(),
    server = http.createServer(app);

app.configure(function(){
  app.set('port', process.env.PORT || 3005);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'geddypooch' }));
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  hbsPrecompiler = require('handlebars-precompiler');

  hbsPrecompiler.watchDir(
    __dirname + "/views/templates",
    __dirname + "/public/javascripts/templates.js",
    ['handlebars', 'hbs']
  );

  app.use(express.errorHandler());
});

// Game state

app.users = new Backbone.Collection();

// Passport (Authenticaton)
passport.use(new LocalStrategy(
  function(username, password, done) {
    models.User.findOne({ username: username }, function(err, user) {
      if(err) {
        return done(err);
      }

      if(!user) {
        return done(null, false, {
          message: 'Invalid username or password!' // We don't want people knowing if the user is valid
        });
      }

      if(user.password != md5(password)) {
        return done(null, false, {
          message: 'Invalid username or password!' // We don't want people knowing if the user is valid
        });
      }

      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  models.User.findById(id, function (err, user) {
    done(err, user);
  });
});

// When server starts. Grab question and store it
models.Question.count({}, function(err, count) {
  app.questionCount = count;

  randomQuestion();
});

// Routes
app.get('/', function(req, res) {
  console.log(req.headers.host);
  if(req.user) {
    res.render('index', {
      title: 'Brain Maintain > Welcome',
      host: req.headers.host,
      userId: req.user._id,
      username: req.user.username,
      userPoints: req.user.points
    });
  } else {
    res.redirect('/login');
  }
});

app.get('/login', function(req, res) {
  res.render('login', {
    title: 'Brain Maintain > Login',
    message: req.flash('error')
  });
});

app.get('/register', function(req, res) {
  res.render('register', {
    title: 'Brain Maintain > Register'
  });
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.post('/sign_up', function(req, res) {
  var username = req.body.username;
      password = req.body.password;

  models.User.findOne({ username: username }, function(err, user) {
    if(err) {
      req.flash('error', 'Database error.');
      res.redirect('/login');
    }

    if(user) {
      req.flash('error', 'Username already exists. Please choose another.');
      res.redirect('/login');
    }

    if(!user) {
      var u = new models.User;

      u.username = username;
      u.password = md5(password);
      u.save(function(err) {
        if(err) {
          req.flash('error', 'There was an error saving. Please try again.');
          res.redirect('/login');
        }

        req.login(u, null, function(err) {
          if(err) {
            req.flash('error', 'There was an error loggin you in. Please try again.');
            res.redirect('/login');
          }

          res.redirect('/');
        });
      });
    }
  });
});

app.get('/logout', function(req, res) {
  req.logOut();
  res.redirect('/');
});

// Random Question
function randomQuestion(callback) {
  var query = models.Question.findOne({});

  query.skip(app.questionCount * Math.random())
  query.exec(function(err, question) {
    if(err) {
      // Handle error
    }

    var answerHash = md5(question.answer);

    question.answer = answerHash;
    app.currentQuestion = question;

    if(callback) {
      callback();
    }
  });
}

// Socket IO
var sio = io.listen(server);

sio.sockets.on('connection', function(client) {
  client.on('userjoin', function(username, userId, userPoints) {
    // Keep track of current user in our socket
    client.userId = userId;

    // Add user to collection
    app.users.add({
      "id": userId,
      "username": username,
      "points": userPoints
    });

    // Broadcast to all clients a new user has joined
    client.broadcast.emit('updateusers', app.users.toJSON());

    // Tell client to start the game
    client.emit('startgame', app.currentQuestion.toJSON(), app.users.toJSON(), username, 'Welcome to brain maintain <b>' + username + '</b>! Good luck and have fun!');
  });

  client.on('answerquestion', function(answer, questionId) {
    if(questionId == app.currentQuestion.id) {
      if(md5(answer) == app.currentQuestion.answer) {
        var user = app.users.get(client.userId),
            score = user.get('points');

        // Increment score up
        score ++;

        // Set backbone model on app side
        user.set('points', score);

        // Broadcasr to all clients to add points to the correct user
        client.broadcast.emit('addpoints', client.userId, score, 'Correct! User <b>' + user.get('username') + '</b> recieves 1 point!');

        // Tell client to add points to the correct user
        client.emit('addpoints', client.userId, score, 'Correct! User <b>' + user.get('username') + '</b> recieves 1 point!');

        // Update the database so we're in sync
        models.User.findById(client.userId, function(err, user) {
          if(err) {
            // Handle error
          }

          user.points = score;
          user.save();
        });

        randomQuestion(function() {
          // Broadcast to all clients the new question
          client.broadcast.emit('updatequestion', app.currentQuestion.toJSON());

          // Tell client the new question
          client.emit('updatequestion', app.currentQuestion.toJSON());
        });
      } else {
        // Tell user they did not answer the question
        client.emit('incorrectanswer', 'Incorrect... Try again before someone else gets the point!');
      }
    }
  });

  client.on('disconnect', function() {
    app.users.remove(client.userId);

    // Broadcast to all clients a user has left
    client.broadcast.emit('updateusers', app.users.toJSON());
  });
});

// Server
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
