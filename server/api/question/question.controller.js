'use strict';

var _ = require('lodash');
var Question = require('./question.model');

// Get list of questions
exports.index = function (req, res) {
  Question.find({ active: true })
    .sort({ "updated.when": -1 })
    .exec(function (err, questions) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(questions);
    });
};

// get list of questions based on query parameters
exports.query = function (req, res) {
  Question.find({ active: true, owner: req.params.owner })
    .sort({ "updated.when": -1 })
    .exec(function (err, questions) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(questions);
    });
};

// Get a single question
exports.show = function (req, res) {
  Question.findById(req.params.id, function (err, question) {
    if (err) { return handleError(res, err); }
    if (!question) { return res.status(404).send('Not Found'); }
    return res.json(question);
  });
};

// Creates a new question in the DB.
exports.create = function (req, res) {
  Question.create(req.body, function (err, question) {
    if (err) { return handleError(res, err); }
    return res.status(201).json(question);
  });
};

// Updates an existing question in the DB.
exports.update = function (req, res) {
  if (req.body._id) { delete req.body._id; }
  Question.findById(req.params.id, function (err, question) {
    if (err) { return handleError(res, err); }
    if (!question) { return res.status(404).send('Not Found'); }
    var updated = _.merge(question, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(question);
    });
  });
};

// Deletes a question from the DB.
exports.destroy = function (req, res) {
  Question.findById(req.params.id, function (err, question) {
    if (err) { return handleError(res, err); }
    if (!question) { return res.status(404).send('Not Found'); }
    question.remove(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}

var assessmentApiUrl = "https://qa.ekstep.in/api/assessment/v3/items/";
/*var createUrl = "https://qa.ekstep.in/api/assessment/v3/items/create";
var updateUrl = "https://qa.ekstep.in/api/assessment/v3/items/update/"*/
var apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjZmJiOWMzNjNkZTk0ZWNiOGJiMDhjYzA0NTlmZjI3YSJ9.pvSbcuIAiu5Cty9FyZSMp3R4O0dXZ3zx6-nz8Xkkf0I";
var itemTemplate = {
  name: '',
  answer: {},
  portalOwner: '562', // ram.j's userid (hopefully!)
  domain: "Numeracy",
  langid: 'en',
  language: ['English'],
  identifier: '',
  qid: '',
  subject: 'NUM',
  grade: 0,
  gradeLevel: [],
  bloomsTaxonomyLevel: '',
  level: '',
  sublevel: '',
  author: 'funtoot',
  keywords: 'wordproblem',
  qindex: '',
  qlevel: 'EASY',
  type: 'ftb',
  template_id: '',
  template: 'org.ekstep.plugins.funtoot.wordproblem',
  title: '',
  question: '',
  question_audio: '',
  question_image: '',
  max_score: 5,
  used_for: "worksheet",
  model: {
    numericLangId: 'en',
    langId: 'en',
    hintMsg: '',
    steps: [{
      text: '',
      answer: '',
      unit: { symbol: '', prefix: false },
      responses: [{
        default: true,
        response: [],
        mh: '',
        mmc: []
      }]
    }],
    variables: {}
  },
  concepts: {
    identifier: 'C6',
    name: 'Counting'
  }
};

exports.publish = function (req, res) {
  if (req.body._id) { delete req.body._id; }
  Question.findById(req.params.id, function (err, question) {
    if (err) { return handleError(res, err); }
    if (!question) { return res.status(404).send('Not Found'); }
    // upload the question to item bank
    var item = _.cloneDeep(itemTemplate);
    item.question = question.questionText;
    item.model.steps = [];
    question.steps.forEach(function (s, i) {
      item.model.steps.push(s);
    });
    //item.model.steps = _.cloneDeep(question.steps);
    item.identifier = question.identifier;
    item.grade = question.grade;
    item.level = question.level;
    item.sublevel = question.sublevel;
    item.bloomsTaxonomyLevel = question.btlo;
    item.model.hintMsg = question.hintText;
    console.log('item', item);
    return res.status(200).json(item);
  });
};
