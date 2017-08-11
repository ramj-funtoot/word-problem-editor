'use strict';

var _ = require('lodash');
var Question = require('./question.model');
var restclient = require('node-rest-client').Client;
var quesTemplate = require('./question.item.template.js');
var fs = require('fs')
const util = require('util')

function storeLog(dataToStore, fileName) {
  fs.writeFile(__dirname + '/' + fileName, dataToStore, function (err) {
    if (err) {
      console.log('!!!!!!!!!!!!--writing log file of ' + fileName + ' fails--!!!!!!!!!!!!');
      console.log(err)
      return;
    }
    console.log('------------writing log file of ' + fileName + 'success--------------');
  })
}

function getImageMimeTypeFromBase64(base64Data) {
  return base64Data.substring("data:image/".length, base64Data.indexOf(";base64"))
}


var envData = {
  'dev': {
    'apiKey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI0Y2Y3ZWM1OGU1Zjg0ZWNlODRmMWU0M2ViMTM5ZDllMCJ9.XlhqVzofiJCGPen42fno3hfJu8OVKUOyFIM1koxfy54',
    'url': 'https://dev.ekstep.in/api/assessment/v3/items/',
    'contentApiUrl': 'https://dev.ekstep.in/content/v3/'
  },
  'qa': {
    'apiKey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjZmJiOWMzNjNkZTk0ZWNiOGJiMDhjYzA0NTlmZjI3YSJ9.pvSbcuIAiu5Cty9FyZSMp3R4O0dXZ3zx6-nz8Xkkf0I',
    'url': 'https://qa.ekstep.in/api/assessment/v3/items/',
    'contentApiUrl': 'https://qa.ekstep.in/content/v3/'
  },
  'prod': {
    'apiKey': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIzY2M5ODMxYjI0ZDc0ZDA5OGM5ZTk0ZTc4M2JlZTY4YiIsImlhdCI6bnVsbCwiZXhwIjpudWxsLCJhdWQiOiIiLCJzdWIiOiIifQ.skn0NOtGIARj7yxBb6g_I6-oQ8rs0Y2RTTI8hALfuYs',
    'url': 'https://api.ekstep.in/assessment/v3/items/',
    'contentApiUrl': 'https://api.ekstep.in/content/v3/'
  }
}


function getFilterClause(a, o) {
  var filter = { active: a };
  if (o) filter['owner'] = o;
  return filter;
}
function getSelectClause(type) {
  if (!type || type == 'summary')
    return { 'questionImage': 0, 'steps': 0, 'options': 0, 'fibs': 0, 'comments': 0, 'hintText': 0, 'expressions': 0, 'comments': 0 }
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


function updateItemStatus(qId, status) {
  Question.findByIdAndUpdate(qId, { $set: { 'state': status, 'updated.when': new Date() } }, function (err, question) {
    if (err) { console.log(err); }
    else if (!question) { console.log(qId + ' Not Found') }
  });
};

function imageToFormData(image) {
  var boundary = '----' + (new Date()).getTime();
  var bodyString = [];
  bodyString.push(
    '--' + boundary,
    //file name and jpg needs to be changed
    'Content-Disposition: form-data; name="' + "file" + '";' + 'filename="' + "my_file.jpg" + '"',
    'Content-Type: ' + "image/jpeg", //change the file type
    'Content-Transfer-Encoding: base64', '', //need /r/n twice here
    image.substring(23) //remove the data:image/jpeg;base64,
  );
  bodyString.push('--' + boundary + '--', '');
  var content = bodyString.join('\r\n');
  return {
    content: content,
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': content.length
    }
  }
}

function uploadImage(imgObj, env, assetId) {
  var url = envData[env].contentApiUrl;
  var client = new restclient();
  //checking asset ID present for the Image
  if (imgObj.assetId && imgObj.assetId.length > 0) {
    client.get(url + 'read/' + imgObj.assetId, function (data, response) {
      //if url is readable then image already exists then upload
      if (response.statusCode == 200 && data.params.errmsg == null) {
        var args = imageToFormData(imgObj.base64);
        return;
        client.patch(url + 'update/' + assetId, args, function (data, response) {
          // check the response
        });
      } else {
        var args = imageToFormData(imgObj.base64);
        return;
        client.post(url + 'update/' + assetId, args, function (data, response) {
        });
      }
    });
  } else {
    // create the assetId creation request Object builder
    imgObj.assetId = assetId;
    var reqObj = quesTemplate.imageAssetTemplate();
    reqObj.request.content.identifier = assetId;
    reqObj.request.content.name = assetId;
    reqObj.request.content.code = assetId;
    reqObj.request.content.mimeType = 'image/' + getImageMimeTypeFromBase64(imgObj.base64);//need to get through getting substring of image base 64 string

    client.post(url + 'create/', reqObj, function (data, response) {
      if (response.statusCode == 200 && data.params.errmsg == null) {

        storeLog(JSON.stringify(data), 'assetIdCreate_Response.json');

        var args = imageToFormData(imgObj.base64);

        storeLog(JSON.stringify(data), 'imagePost_request_argument.json');

        return;
        client.post(url + 'update/' + assetId, args, function (data, response) {
          if (response.statusCode == 200) {
            // update the url
            imgObj.url[env] = url;
          }
        });
      } else if (response.statusCode == 400) {
        // asset already exists.. post the image
        var args = imageToFormData(imgObj.base64);
        client.post(url + 'update/' + assetId, args, function (data, response) {
          // check the response
          if (response.statusCode != 200) {
            // do a patch
            client.patch(url + 'update/' + assetId, args, function (data, response) {
              // check the response
              if (response.statusCode == 200) {
              }
            });
          }
        });
      } else {
        console.log('the response Code is ' + response.statusCode);
        storeLog(JSON.stringify(data), 'assetIdCreate_Response_403.json');
      }
    });
  }
}

function uploadImages(question, env) {
  //is assetId already exists, if not generating asset id
  var assetId = (!question.questionImage[0].assetId)
    ? 'org.ekstep.funtoot.' + question.identifier + '.image' + Math.random().toString().replace("0", "")
    : question.questionImage[0].assetId;

  uploadImage(question.questionImage[0], env, assetId);
  return;
  if (question.qtype == "mcq") {
    question.options.forEach(function (option, i) {
      //check if the option is having image property with out null
      if (option.image != null) {
        var opAssetId = (option.image.assetId.length == 0)
          ? 'org.ekstep.funtoot.' + question.identifier + '.image' + Math.random().toString().replace("0", "")
          : option.image.assetId;
        uploadImage(option.image, env, opAssetId);
      }
    });
  }
}

function publishQuestion(qIds, env, messages, res, code) {
  if (code && code != 200) {
    res.status(code).json(messages);
    return;
  }
  var qs = qIds.splice(0, 1);
  if (qs.length == 0) {
    res.status(code).json(messages);
    return;
  }
  var qid = qs[0];
  Question.findOne({ 'identifier': qid }, function (err, question) {
    if (err) {
      messages[qid] = err;
      publishQuestion(qIds, env, messages, res);
    }
    else if (!question) {
      messages[qid] = 'Not Found';
      publishQuestion(qIds, env, messages, res);
    }
    else {
      //starting upload or update process of imges in ekstep db
      if (question.questionImage.length > 0) {
        //uploadImages(question, env);
      }

      // cloning and applying  common properties of questions into item template
      var item = quesTemplate.getCommonTemplate();
      item.question = question.questionText;
      item.identifier = item.qid = item.code = item.name = question.identifier;
      item.grade = question.grade;
      item.gradeLevel = ["Grade " + question.grade];
      item.level = question.level;
      item.sublevel = question.sublevel;
      item.bloomsTaxonomyLevel = question.btlo;
      item.model.hintMsg = question.hintText;
      item.concepts.identifier = question.conceptCode;
      item.qtype = question.qtype;

      _.each(question.workSheets, function (w, k) {
        if (w.id)
          item.keywords.push(w.id);
      });
      if (question.expressions && typeof (question.expressions) == "string") {
        _.each(question.expressions.split(/\r?\n/), function (exp) {
          var tokens = exp.split('=');
          item.model.variables[tokens[0]] = tokens[1];
        });
      }

      //applying question type specific properties into item template
      switch (question.qtype) {
        case "legacy-word-problem": {
          item.type = 'ftb';
          item.template_id = 'org.ekstep.plugins.funtoot.fibWordProblem';
          item.template = 'org.ekstep.plugins.funtoot.fibWordProblem';
          item.keywords = ['wordproblem'];
          item.model.steps = [];
          question.steps.forEach(function (s, i) {
            item.model.steps.push(s);
          });
          item.i18n = question.i18n;
          break;
        }
        case "mcq": {
          item.type = 'mcq';
          item.template_id = 'org.ekstep.plugins.funtoot.genericmcq';
          item.template = 'org.ekstep.plugins.funtoot.genericmcq';
          item.keywords = ['mcq'];
          var mcqTemplate = quesTemplate.getMCQTemplate();
          item = _.assign({}, item, mcqTemplate);
          _.forEach(question.options, function (option, i) {
            item.options.push(quesTemplate.mcqOptionTemplate());
            item.options[i].value.asset = option.text;

            item.options[i].value.image = option.image;
            item.options[i].value.count = null;
            item.options[i].answer = option.answer;
            item.options[i].mmc = option.mmc;
            item.options[i].mh = option.mh;
            if (option.text == "" || option.text == undefined) {
              item.options[i].value.type = "image";
              if (option.image.assetId) {
                item.options[i].value.asset = optoin.image.assetId;
              }
            }
          });
          item.model.mcqType = question.mcqType;
          item.i18n = question.i18n;
          break;
        }
        case "freeResponse": {
          item.i18n = question.i18n;
          item.keywords = ['freeResponse'];
          item.type = 'ftb';
          item.template_id = 'org.ekstep.plugins.funtoot.genericfib';
          item.template = 'org.ekstep.plugins.funtoot.genericfib';
          item.model.fibs = [];
          item.model.steps = [];
          question.fibs.forEach(function (fib, i) {
            item.model.fibs.push(fib);
          });
          break;
        }
      }

      var ekstep_env = env; // 'qa' or 'dev' or 'prod'
      var url = envData[ekstep_env].url; //"https://" + ekstep_env + ".ekstep.in/api/assessment/v3/items/create";

      var reqBody = { "request": { "assessment_item": {} } };
      reqBody.request.assessment_item.identifier = item.code;
      reqBody.request.assessment_item.objectType = "AssessmentItem";
      reqBody.request.assessment_item.metadata = item;

      var authheader = 'Bearer ' + envData[ekstep_env].apiKey;
      var args = {
        //path: { id: item.code, tid: 'domain' },
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

      client.post(url + 'create/', args, function (data, response) {
        if (response.statusCode == 200 || response.statusCode == 400) {
          if (data.params && data.params.errmsg) {
            if (data.params.errmsg.indexOf("Object already exists with identifier") !== -1) {
              console.log(item.code + ' already exists. Updating..')
              url = url + 'update/' + item.code;
              //console.log(JSON.stringify(args));
              client.patch(url, args, function (data, response) {
                if (response.statusCode == 200) {
                  messages[qid] = { message: 'Published', statusCode: response.statusCode };
                  if (env == 'prod')
                    updateItemStatus(question._id, 'Published');
                  publishQuestion(qIds, env, messages, res, response.statusCode);
                }
                else {
                  messages[qid] = { message: err, statusCode: response.statusCode };
                  publishQuestion(qIds, env, messages, res, response.statusCode);
                }
              }).on('error', function (err) {
                messages[qid] = { message: err, statusCode: response.statusCode };
                publishQuestion(qIds, env, messages, res, response.statusCode);
              });
            }
            else {
              messages[qid] = { message: data.params, statusCode: response.statusCode };
              publishQuestion(qIds, env, messages, res, response.statusCode);
            }
          }
          else {
            messages[qid] = { message: 'Published', statusCode: response.statusCode };
            if (env == 'prod')
              updateItemStatus(question._id, 'Published');
            publishQuestion(qIds, env, messages, res, response.statusCode);
          }
        }
        else {
          messages[qid] = { message: data, statusCode: response.statusCode };
          publishQuestion(qIds, env, messages, res, response.statusCode);
        }
      }).on('error', function (err) {
        messages[qid] = { message: err, statusCode: '' };
        publishQuestion(qIds, env, messages, res, 501);
      });
    }
  });
}

exports.publish = function (req, res) {
  if (req.body._id) { delete req.body._id; }
  var qIds = req.body;
  var messages = {};
  var env = req.params.env;
  publishQuestion(qIds, env, messages, res);
}
