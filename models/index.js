// Dependencies

var mongoose = require('mongoose'),
    config = require('./../config.json');

// Database Connection

mongoose.connect(
  'mongodb://' +
  config.username +
  ':' +
  config.password +
  '@' +
  config.host +
  ':' +
  config.port +
  '/' +
  config.database);

// Mongoose Schemas for Models

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

// Models

var QuestionSchema = new Schema({
  text: { type: String, required: true },
  answer: { type: String, required: true },
  approved: { type: Boolean, default: false },
  current: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now, required: true }
});

exports.Question = mongoose.model('Question', QuestionSchema);

var UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  points: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now, required: true }
});

exports.User = mongoose.model('User', UserSchema);