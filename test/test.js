var models = require('./../models'),
    md5 = require('MD5');

describe('Users', function() {
  var currentUser = null;

  beforeEach(function(done) {
    var u = new models.User;

    u.username = 'testuser';
    u.password = md5('password');
    u.save(function(err) {
      currentUser = u;
      done();
    });
  });

  afterEach(function(done) {
    models.User.findOne({ username: 'testuser' }, function(err, user) {
      user.remove(function() {
        done();
      });
    });
  });

  it('finds user by username', function(done) {
    models.User.findOne({ username: currentUser.username }, function(err, user) {
      user.username.should.eql('testuser');
      done();
    });
  });

  it('finds user by id', function(done) {
    models.User.findById(currentUser._id, function(err, user) {
      user._id.should.eql(currentUser._id);
      done();
    });
  });

  it('checks if user password is hashed', function(done) {
    currentUser.password.should.eql(md5('password'));
    done();
  });
});

describe('Questions', function(done) {
  var currentQuestion = null;

  beforeEach(function(done) {
    var q = new models.Question;

    q.text = 'Test Question';
    q.answer = '0';
    q.approved = true;
    q.save(function(err) {
      currentQuestion = q;
      done();
    });
  });

  afterEach(function(done) {
    models.Question.findById(currentQuestion._id, function(err, question) {
      question.remove(function() {
        done();
      });
    });
  });

  it('finds question by id', function(done) {
    models.Question.findById(currentQuestion._id, function(err, question) {
      question._id.should.eql(currentQuestion._id);
      done();
    });
  });

  it('checks question answer', function(done) {
    currentQuestion.answer.should.eql('0');
    done();
  });

  it('checks question answer with hash', function(done) {
    var answerHash = md5(currentQuestion.answer);

    answerHash.should.eql(md5('0'));
    done();
  });
});