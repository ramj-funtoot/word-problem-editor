'use strict';

var _ = require('lodash');
var Question = require('./question.model');
var restclient = require('node-rest-client').Client;
const util = require('util')

function getFilterClause(a, o) {
  var filter = { active: a };
  if (o) filter['owner'] = o;
  return filter;
}
function getSelectClause(type) {
  if (!type || type == 'summary')
    return { 'questionImage': 0, 'steps': 0, 'comments': 0, 'hintText': 0 }
}
// Get list of questions
exports.index = function (req, res) {
  var active = req.query.active || true;
  var owner = req.query.owner;
  if (!req.query.type || req.query.type == 'summary') {
    Question.find(getFilterClause(active, owner))
      .select(getSelectClause(req.query.type))
      .sort({ "updated.when": -1 })
      .lean()
      .exec(function (err, questions) {
        if (err) { return handleError(res, err); }
        return res.status(200).json(questions);
      });
  }
  else if (req.query.type && req.query.type == 'detail') {
    if (req.query.id) {
      Question.findOne({ 'identifier': req.query.id })
        .lean()
        .exec(function (err, question) {
          if (err) { return handleError(res, err); }
          if (!question) { return res.status(404).send('Not Found'); }
          return res.json(question);
        });
    }
    else {
      Question.find(getFilterClause(active, owner))
        .sort({ "updated.when": -1 })
        .lean()
        .exec(function (err, questions) {
          if (err) { return handleError(res, err); }
          return res.status(200).json(questions);
        });
    }
  }
};

// get list of questions based on query parameters
exports.query = function (req, res) {
  Question.find({ active: true, owner: req.params.owner })
    .sort({ "updated.when": -1 })
    .lean()
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
    return res.json(question.toObject());
  });
};

// Creates a new question in the DB.
exports.create = function (req, res) {
  Question.create(req.body, function (err, question) {
    if (err) { return handleError(res, err); }
    return res.status(201).json(question.toObject());
  });
};

// Updates an existing question in the DB.
exports.update = function (req, res) {
  if (req.body._id) { delete req.body._id; }
  Question.findByIdAndUpdate(req.params.id, { $set: req.body }, function (err, question) {
    if (err) { return handleError(res, err); }
    if (!question) { return res.status(404).send('Not Found'); }
    return res.status(200).json(question.toObject());
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
  return res.status(500).json(err);
}

var itemTemplate = {
  name: '',
  answer: {},
  portalOwner: '562', // ram.j's userid (hopefully!)
  domain: "Numeracy",
  langid: 'en',
  language: ['English'],
  identifier: '',
  qid: '',
  code: '',
  subject: 'NUM',
  grade: 0,
  gradeLevel: [],
  bloomsTaxonomyLevel: '',
  level: '',
  sublevel: '',
  author: 'funtoot',
  keywords: ['wordproblem'],
  qindex: '',
  qlevel: 'EASY',
  qtype: 'legacy-word-problem',
  type: 'ftb',
  template_id: 'org.ekstep.plugins.funtoot.fibWordProblem',
  template: '',
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

function updateItemStatus(qId, status) {
  Question.findByIdAndUpdate(qId, { $set: { 'state': status, 'updated.when': new Date() } }, function (err, question) {
    if (err) { console.log(err); }
    else if (!question) { console.log(qId + ' Not Found') }
  });
};

function publishQuestion(qIds, messages, res) {
  var qs = qIds.splice(0, 1);
  if (qs.length == 0) {
    res.status(200).json(messages);
    return;
  }
  var qid = qs[0];
  Question.findOne({ 'identifier': qid }, function (err, question) {
    if (err) {
      messages[qid] = err;
      publishQuestion(qIds, messages, res);
    }
    else if (!question) {
      messages[qid] = 'Not Found';
      publishQuestion(qIds, messages, res);
    }
    else {
      // upload the question to item bank
      var item = _.cloneDeep(itemTemplate);
      item.question = question.questionText;
      item.model.steps = [];
      question.steps.forEach(function (s, i) {
        item.model.steps.push(s);
      });
      item.identifier = item.code = item.name = question.identifier;
      item.grade = question.grade;
      item.gradeLevel = ["Grade " + question.grade];
      item.level = question.level;
      item.sublevel = question.sublevel;
      item.bloomsTaxonomyLevel = question.btlo;
      item.model.hintMsg = question.hintText;
      item.keywords = item.keywords || ['wordproblem'];
      _.each(question.workSheets, function (w, k) {
        if (w.id)
          item.keywords.push(w.id);
      });
      _.each(question.expressions.split(/\r?\n/), function (exp) {
        var tokens = exp.split('=');
        item.model.variables[tokens[0]] = tokens[1];
      });
      var ekstep_env = 'qa'; // 'qa' or 'dev' or 'community'
      var apikey = {
        'dev': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI0Y2Y3ZWM1OGU1Zjg0ZWNlODRmMWU0M2ViMTM5ZDllMCJ9.XlhqVzofiJCGPen42fno3hfJu8OVKUOyFIM1koxfy54',
        'qa': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjZmJiOWMzNjNkZTk0ZWNiOGJiMDhjYzA0NTlmZjI3YSJ9.pvSbcuIAiu5Cty9FyZSMp3R4O0dXZ3zx6-nz8Xkkf0I',
        'community': 'no-key-available-for-production-as-yet!!'
      };
      var url = "https://" + ekstep_env + ".ekstep.in/api/assessment/v3/items/create";

      var reqBody = { "request": { "assessment_item": {} } };
      reqBody.request.assessment_item.identifier = item.code;
      reqBody.request.assessment_item.objectType = "AssessmentItem";
      reqBody.request.assessment_item.metadata = item;

      var authheader = 'Bearer ' + apikey[ekstep_env];
      var args = {
        path: { id: item.code, tid: 'domain' },
        headers: {
          "Content-Type": "application/json",
          "Authorization": authheader
        },
        data: reqBody,
        requestConfig: {
          timeout: 240000
        },
        responseConfig: {
          timeout: 240000
        }
      };
      var client = new restclient();
      client.post(url, args, function (data, response) {
        if (data.params && data.params.errmsg) {
          if (data.params.errmsg.indexOf("Object already exists with identifier") !== -1) {
            url = "https://" + ekstep_env + ".ekstep.in/api/assessment/v3/items/update/" + item.code;
            client.patch(url, args, function (data, response) {
              messages[qid] = 'Published';
              updateItemStatus(question._id, 'Published');
              publishQuestion(qIds, messages, res);
            }).on('error', function (err) {
              messages[qid] = err;
              publishQuestion(qIds, messages, res);
            });
          }
          else {
            messages[qid] = data.params;
            publishQuestion(qIds, messages, res);
          }
        }
        else {
          messages[qid] = 'Published';
          updateItemStatus(question._id, 'Published');
          publishQuestion(qIds, messages, res);
        }
      }).on('error', function (err) {
        messages[qid] = err;
        publishQuestion(qIds, messages, res);
      });
    }
  });
}

exports.publish = function (req, res) {
  if (req.body._id) { delete req.body._id; }
  var qIds = req.body;
  var messages = {};
  qIds.forEach(function (qid) {
    messages[qid] = '';
  });
  publishQuestion(qIds, messages, res);
}
