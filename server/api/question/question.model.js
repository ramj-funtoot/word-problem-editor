'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var validUnitPlacements = ['pre', 'post'];
var validStates = ['Draft', 'In-Review', 'Published', 'Rejected'];
var validBtlos = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
var validDifficultyLevels = [1, 2, 3, 4, 5]

var QuestionSchema = new Schema({
  identifier: { type: String, unique: true },
  grade: { type: Number, min: 1, max: 5 },
  level: Number,
  subLevel: Number,
  btlo: { type: String, enum: validBtlos },
  difficultyLevel: { type: Number, min: 1, max: 5 },
  subject: { type: String, default: 'NUM' },
  conceptCode: String,
  es_difficultyLevel: String,
  active: Boolean,
  updated: { type: Date, default: Date.now },
  owner: String,
  state: { type: String, enum: validStates },

  maxAttempts: { type: Number, max: 10 },
  questionText: String,
  questionImage: String,
  steps: [{
    text: String,
    answer: String,
    unit: String,
    unitPlacement: { type: String, enum: validUnitPlacements },
    responses: [{
      response: [String],
      mmc: [String],
      mh: String
    }]
  }],
  hintText: String,
  solutionText: String,
  expressions: [String],
  comments: [{
    created: { type: Date, default: Date.now },
    commentedBy: String,
  }]
});

module.exports = mongoose.model('Question', QuestionSchema);