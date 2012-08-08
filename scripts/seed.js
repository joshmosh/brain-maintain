// Questions File

var questionData = require('./questions.json');

// Dependencies

var models = require('./../models'),
    _ = require('underscore');

// Seed the database

_.each(questionData.questions, function(question, index) {
  var q = new models.Question;

  q.text = question.question;
  q.answer = question.answer;
  q.approved = true;
  q.save();
});