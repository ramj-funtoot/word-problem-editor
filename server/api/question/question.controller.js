'use strict';

var _ = require('lodash');
var Question = require('./question.model');
var restclient = require('node-rest-client').Client;
var request = require('request');
var quesTemplate = require('./question.item.template.js');
var fs = require('fs');
var Promise = require('bluebird');
var winston = require('winston');
var Translate = require('@google-cloud/translate')();
const util = require('util');

/*
worksheet detail module.
the task is scheduled to run every day at 1 AM as well as when the server is initialised.
*/
var schedule_wsd = require("./wsd.schedule")();

exports.wsd = function (req, res) {
  fs.readFile("worksheetDetails.json", 'utf8', function (err, data) {
    if (err) {
      console.log("Error getting file", err);
    }
    return res.status(200).json(JSON.parse(data));
  })
}

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({
      filename: 'zcat.server.log'
    })
  ]
});

function getImageMimeTypeFromBase64(base64Data) {
  return base64Data.substring("data:image/".length, base64Data.indexOf(";base64"))
}

function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
}

var envData = {
  'dev': {
    'apiKey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI0Y2Y3ZWM1OGU1Zjg0ZWNlODRmMWU0M2ViMTM5ZDllMCJ9.XlhqVzofiJCGPen42fno3hfJu8OVKUOyFIM1koxfy54',
    'url': 'https://dev.ekstep.in/api/assessment/v3/items/',
    'contentApiUrl': 'https://dev.ekstep.in/api/content/v3/'
  },
  'qa': {
    'apiKey': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI2Zjc1MTA1MmMyMjA0YWI3OWI3ZWRiZmU1NTlmNTQyOCIsImlhdCI6bnVsbCwiZXhwIjpudWxsLCJhdWQiOiIiLCJzdWIiOiIifQ.EkiH5RkIr0FIeUu8aNGmQEmEWKtVwr5e2Fhm-cefMxQ',
    'url': 'https://qa.ekstep.in/api/assessment/v3/items/',
    'contentApiUrl': 'https://qa.ekstep.in/api/content/v3/'
  },
  'prod': {
    'apiKey': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIzY2M5ODMxYjI0ZDc0ZDA5OGM5ZTk0ZTc4M2JlZTY4YiIsImlhdCI6bnVsbCwiZXhwIjpudWxsLCJhdWQiOiIiLCJzdWIiOiIifQ.skn0NOtGIARj7yxBb6g_I6-oQ8rs0Y2RTTI8hALfuYs',
    'url': 'https://api.ekstep.in/assessment/v3/items/',
    'contentApiUrl': 'https://api.ekstep.in/content/v3/'
  }
}

function getFilterClause(a, o) {
  var filter = {
    active: a
  };
  if (o) filter['owner'] = o;
  return filter;
}

function getSelectClause(type) {
  if (!type || type == 'summary')
    return {
      'questionImage': 0,
      'steps': 0,
      'options': 0,
      'fibs': 0,
      'comments': 0,
      'hintText': 0,
      'expressions': 0,
      'comments': 0
    }
}

function getImageUpdateObject(opts) {
  var updateObj = {};
  updateObj[opts.imageType + opts.index + '.assetId']
  if (opts.imageType == 'questionImage') {
    updateObj["questionImage." + opts.index + ".assetId"] = opts.assetId;
    updateObj["questionImage." + opts.index + ".urls." + opts.env] = opts.url
  } else if (opts.imageType == "option") {
    updateObj["options." + opts.index + ".image.assetId"] = opts.assetId
    updateObj["options." + opts.index + ".image.urls." + opts.env] = opts.url
  } else if (opts.imageType == "premise") {
    updateObj["premises." + opts.index + ".image.assetId"] = opts.assetId
    updateObj["premises." + opts.index + ".image.urls." + opts.env] = opts.url
  } else if (opts.imageType == "response") {
    updateObj["responses." + opts.index + ".image.assetId"] = opts.assetId
    updateObj["responses." + opts.index + ".image.urls." + opts.env] = opts.url
  } else if (opts.imageType == "sequence") {
    updateObj["seqSteps." + opts.index + ".image.assetId"] = opts.assetId
    updateObj["seqSteps." + opts.index + ".image.urls." + opts.env] = opts.url
  }
  return updateObj
}

function createImageContent(assetId, imageMimeType, env, callback) {
  var options = {
    method: 'POST',
    url: envData[env].contentApiUrl + 'create', //need to replaced based on the env type
    headers: {
      'cache-control': 'no-cache',
      authorization: 'Bearer ' + envData[env].apiKey,
      'content-type': 'application/json'
    },
    body: {
      request: {
        content: {
          identifier: assetId,
          osId: 'org.ekstep.quiz.app',
          mediaType: 'image',
          visibility: 'Default',
          description: 'Test_QA',
          name: assetId,
          language: ['English'],
          contentType: 'Asset',
          code: assetId,
          mimeType: 'image/' + imageMimeType //need to get through getting substring of image base 64 string
        }
      }
    },
    json: true
  };

  request(options, function (error, response, body) {
    if (error) {
      logger.error(JSON.stringify(error));
      callback(null);
    }
    logger.info(JSON.stringify(body));

    if (response.statusCode == 200 && body.params.errmsg == null) {
      callback(response);
    }
  });
}

function readImageAsset(assetID, env, callback) {
  var options = {
    method: 'GET',
    url: envData[env].contentApiUrl + 'read/' + assetID, //need to replaced based on the env type
    headers: {
      'cache-control': 'no-cache',
      authorization: 'Bearer ' + envData[env].apiKey,
      'content-type': 'application/json'
    }
  }
  request.get(options, function (err, response) {
    if (err) {
      logger.error(err);
      callback(null);
    } else
      callback(response);
  })
}

function uploadImageToContent(env, assetId, imageMimeType, callback) {
  var boundary = (new Date()).getTime();
  var options = {
    method: 'POST',
    'url': envData[env].contentApiUrl + 'upload/' + assetId,
    'headers': {
      'cache-control': 'no-cache',
      'authorization': 'Bearer ' + envData[env].apiKey,
      'content-type': 'multipart/form-data; boundary=----' + boundary
    },
    'formData': {
      'file': {
        'value': fs.createReadStream(assetId + '.' + imageMimeType),
        'options': {
          'filename': assetId + '.' + imageMimeType,
          'content-type': 'image/' + imageMimeType
        }
      }
    }
  }
  var req = request.post(options, function (err, response, body) {
    if (err) {
      logger.error(err);
      callback(null);
    } else {
      callback(response);
    }
    //return; //currently no need to delete the images as they were useful for debugging
    fs.unlink('./' + assetId + '.' + imageMimeType, function (err) {
      if (err) {
        return console.log(err);
      }
      console.log(assetId + '.' + imageMimeType + '  deleted successfully');
    });
  });
}

// Get list of questions
exports.index = function (req, res) {
  var active = req.query.active || true;
  var owner = req.query.owner;
  if (!req.query.type || req.query.type == 'summary') {
    Question.find(getFilterClause(active, owner))
      .select(getSelectClause(req.query.type))
      .sort({
        "updated.when": -1
      })
      .lean()
      .exec(function (err, questions) {
        if (err) {
          return handleError(res, err);
        }
        return res.status(200).json(questions);
      });
  } else if (req.query.type && req.query.type == 'detail') {
    if (req.query.id) {
      Question.findOne({
        'identifier': req.query.id
      })
        .lean()
        .exec(function (err, question) {
          if (err) {
            return handleError(res, err);
          }
          if (!question) {
            return res.status(404).send('Not Found');
          }
          return res.json(question);
        });
    } else {
      Question.find(getFilterClause(active, owner))
        .sort({
          "updated.when": -1
        })
        .lean()
        .exec(function (err, questions) {
          if (err) {
            return handleError(res, err);
          }
          return res.status(200).json(questions);
        });
    }
  }
};

// get list of questions based on query parameters
exports.query = function (req, res) {
  Question.find({
    active: true,
    owner: req.params.owner
  })
    .sort({
      "updated.when": -1
    })
    .lean()
    .exec(function (err, questions) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(questions);
    });
};

// Get a single question
exports.show = function (req, res) {
  Question.findById(req.params.id, function (err, question) {
    if (err) {
      return handleError(res, err);
    }
    if (!question) {
      return res.status(404).send('Not Found');
    }
    return res.json(question.toObject());
  });
};

// Creates a new question in the DB.
exports.create = function (req, res) {
  Question.create(req.body, function (err, question) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(201).json(question.toObject());
  });
};

// Updates an existing question in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Question.findByIdAndUpdate(req.params.id, {
    $set: req.body
  }, function (err, question) {
    if (err) {
      return handleError(res, err);
    }
    if (!question) {
      return res.status(404).send('Not Found');
    }
    return res.status(200).json(question.toObject());
  });
};

// Deletes a question from the DB.
exports.destroy = function (req, res) {
  Question.findById(req.params.id, function (err, question) {
    if (err) {
      return handleError(res, err);
    }
    if (!question) {
      return res.status(404).send('Not Found');
    }
    question.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).json(err);
}

function updateItemStatus(qId, status) {
  Question.findByIdAndUpdate(qId, {
    $set: {
      'state': status,
      'updated.when': new Date()
    }
  }, function (err, question) {
    if (err) {
      console.log(err);
    } else if (!question) {
      console.log(qId + ' Not Found')
    }
  });
};

function uploadImageAndUpdateQuestion(data) {
  return new Promise(function (resolve, reject) {
    var fileName = data.assetId + '.' + data.imageMimeType;
    fs.writeFile(fileName, data.imageBuffer.data, function (err) {
      if (err) {
        logger.error(err);
        // resolve with an empty object instead of reject
        resolve({});
      } else {
        //UPLOAD IMAGE => The base 64 successfully stored as file
        uploadImageToContent(data.env, data.assetId, data.imageMimeType, function (response) {
          if (response && response.statusCode == 200) {
            // read the image asset from content api, to get the s3Key
            readImageAsset(data.assetId, data.env, function (readResp) {
              if (readResp.statusCode == 200) {
                var respBody = JSON.parse(readResp.body);
                var imageAssetIdUpdatObject = getImageUpdateObject({
                  imageType: data.imageType,
                  index: data.imageIndex,
                  assetId: data.assetId,
                  env: data.env,
                  url: respBody.result.content.downloadUrl
                })
                Question.collection.updateOne({
                  'identifier': data.qId
                }, {
                    $set: imageAssetIdUpdatObject
                  }, function (err, response) {
                    if (err) {
                      logger.error('Failed when updating image for question ' + data.qId + ' - assetId' + data.assetId)
                      logger.error(err);
                      resolve({});
                    } else {
                      logger.info('Successfully updated image for question ' + data.qId + ' - assetId' + data.assetId);
                      resolve({
                        id: data.assetId,
                        src: respBody.result.content.downloadUrl,
                        type: 'image'
                      })
                    }
                  });
              } else {
                logger.error('readAsset failed with responseCod ' + readResp.statusCode)
                logger.error('readAsset response ', readResp)
              }
            });
          }
        })
      }
    })
  })
}

function uploadImage(imgObj, env, assetId, qId, imageType, imageIndex) {
  return new Promise(function (resolve, reject) {
    var imageMimeType = getImageMimeTypeFromBase64(imgObj.base64);
    //just creates new assetId (with out image) to store the image
    createImageContent(assetId, imageMimeType, env, function (response) {
      if (response && response.statusCode == 200) {
        // upload the image and then update the mongodb document
        logger.info('Asset created successfully');
        //GET THE IMAGE BASE64 AND STORE AS IMAGE AND GET THE IMAGE TYPE
        var data = {
          qId: qId,
          assetId: assetId,
          imageIndex: imageIndex,
          imageType: imageType,
          imageBuffer: decodeBase64Image(imgObj.base64),
          imageMimeType: imageMimeType,
          env: env
        }
        uploadImageAndUpdateQuestion(data).then(function (results) {
          // image uploaded successfully, now let's update the question
          logger.info('asset uploaded and database was updated successfully for ' + qId + ' - assetId ' + assetId);
          resolve(results);
        }).catch(function (err) {
          logger.error('Failed asset upload and database updat for ' + qId + ' - assetId ' + assetId);
          logger.error(err)
          reject(results)
        });
      } else if (response.statusCode == 400) {
        // AssetID not created
        console.warn("Failed when creating the asset");
        resolve({});
      }
    })
  });
}

function uploadImages(question, env, callback) {
  var imgUploadPromises = [];
  if (question.questionImage.length > 0 && question.questionImage[0].isValid && (!question.questionImage[0].assetId || (question.questionImage[0].assetId && !question.questionImage[0].urls[env]))) {
    var assetId = 'org.ekstep.funtoot.' + question.identifier + '.image' + Math.random().toString().replace('0', '')
    imgUploadPromises.push(uploadImage(question.questionImage[0], env, assetId, question.identifier, 'questionImage', 0));
  }

  if (question.qtype == 'mcq') {
    question.options.forEach(function (option, i) {
      //check if the option is having image property with out null
      if (option.image && option.image.isValid && (!option.image.assetId || option.image.assetId.length == 0 || (option.image.assetId && option.image.assetId.length > 0 && !option.image.urls[env]))) {
        var opAssetId = 'org.ekstep.funtoot.' + question.identifier + '.image' + Math.random().toString().replace('0', '');
        imgUploadPromises.push(uploadImage(option.image, env, opAssetId, question.identifier, 'option', i));
      }
    });
  } else if (question.qtype == 'mtf') {
    question.premises.forEach(function (premise, i) {
      if (premise.image && premise.image.isValid && (!premise.image.assetId || premise.image.assetId.length == 0 || (premise.image.assetId && premise.image.assetId.length > 0 && !premise.image.urls[env]))) {
        var opAssetId = 'org.ekstep.funtoot.' + question.identifier + '.image' + Math.random().toString().replace('0', '');
        imgUploadPromises.push(uploadImage(premise.image, env, opAssetId, question.identifier, 'premise', i));
      }
    })

    question.responses.forEach(function (response, i) {
      if (response.image && response.image.isValid && (!response.image.assetId || response.image.assetId.length == 0 || (response.image.assetId && response.image.assetId.length > 0 && !response.image.urls[env]))) {
        var opAssetId = 'org.ekstep.funtoot.' + question.identifier + '.image' + Math.random().toString().replace('0', '');
        imgUploadPromises.push(uploadImage(response.image, env, opAssetId, question.identifier, 'response', i));
      }
    })

  } else if (question.qtype == 'Sequencing') {
    question.seqSteps.forEach(function (sequence, i) {
      if (sequence.image && sequence.image.isValid && (!sequence.image.assetId || sequence.image.assetId.length == 0 || (sequence.image.assetId && sequence.image.assetId.length > 0 && !sequence.image.urls[env]))) {
        var opAssetId = 'org.ekstep.funtoot.' + question.identifier + '.image' + Math.random().toString().replace('0', '');
        imgUploadPromises.push(uploadImage(sequence.image, env, opAssetId, question.identifier, 'sequence', i));
      }
    })
  }

  if (imgUploadPromises.length > 0) {
    Promise.all(imgUploadPromises).then(function (results) {
      logger.info(question.identifier, 'All images uploaded successfully ');
      logger.info(results);
      Question.findOne({
        'identifier': question.identifier
      }, function (err, updatedQuestion) {
        callback(updatedQuestion);
      });
      // results is an array of all the parsed bodies in order
    }).catch(function (err) {
      logger.error(err);
      Question.findOne({
        'identifier': question.identifier
      }, function (err, updatedQuestion) {
        callback(updatedQuestion);
      });
    });
  } else {
    Question.findOne({
      'identifier': question.identifier
    }, function (err, updatedQuestion) {
      callback(updatedQuestion);
    });
  }
}

function publishQuestion(qIds, env, messages, res, code) {
  var qs = qIds.splice(0, 1);
  if (qs.length == 0) {
    if (!code) code = 404;
    res.status(code).json(messages);
    return;
  }
  var qid = qs[0];
  Question.findOne({
    'identifier': qid
  }).lean().exec(function (err, question) {
    if (err) {
      console.log(err);
      messages[qid] = err;
      publishQuestion(qIds, env, messages, res);
    } else if (!question) {
      console.log(qid + ' not found');
      messages[qid] = 'Not Found';
      publishQuestion(qIds, env, messages, res);
    } else {
      //starting upload or update process of imges in ekstep db
      uploadImages(question, env, function (question) {
        // cloning and applying  common properties of questions into item template
        var item = quesTemplate.getCommonTemplate();
        item.media = [];
        item.question = question.questionText;
        item.identifier = item.qid = item.code = item.name = question.identifier;

        _.forEach(question.grade, function (grade, index) {
          //ekstep accepting grade value [ "1", "4"], if it is number array like [1,4] 400 type error returns
          item.grade.push(grade.toString());
          //adding each grade to gradeLevel
          if(env == "qa"){
            item.gradeLevel.push("Class " + grade);
          }else{
            item.gradeLevel.push("Grade " + grade);
          }
        })

        item.level = question.level;
        item.sublevel = question.subLevel;
        item.bloomsTaxonomyLevel = question.btlo;
        item.state = question.state;
        item.status = 'Live';//question.state == 'Verified' ? 'Live' : 'Draft';
        item.model.hintMsg = question.hintText;
        item.concepts.identifier = question.conceptCode;
        item.qtype = question.qtype;
        item.i18n = question.i18n;
        item.flags = question.flags;
        if (question.questionImage && question.questionImage.length > 0 && question.questionImage[0].isValid) {
          item.questionImage = question.questionImage[0].assetId;
          item.media.push({
            id: question.questionImage[0].assetId,
            src: question.questionImage[0].urls[env],
            type: 'image'
          });
        }
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
          case "legacy-word-problem":
            {
              item.type = 'ftb';
              item.template_id = 'org.ekstep.plugins.funtoot.fibWordProblem';
              item.template = 'org.ekstep.plugins.funtoot.fibWordProblem';
              item.keywords = ['wordproblem'];
              item.model.steps = [question.steps[question.steps.length - 1]];
              break;
            }
          case "mcq":
            {
              item.type = 'mcq';
              item.template_id = 'org.ekstep.plugins.funtoot.genericmcq';
              item.template = 'org.ekstep.plugins.funtoot.genericmcq';
              item.keywords = ['mcq'];
              var mcqTemplate = quesTemplate.getMCQTemplate();
              item = _.assign({}, item, mcqTemplate);
              _.forEach(question.options, function (option, i) {
                item.options.push(quesTemplate.mcqOptionTemplate());
                item.options[i].value.asset = option.text;

                item.options[i].value.image = option.image.assetId;
                item.options[i].value.count = null;
                item.options[i].answer = option.answer;
                item.options[i].mmc = option.mmc;
                item.options[i].mh = option.mh;
                item.options[i].value.type = (option.image && option.image.assetId) ? 'image' : 'text';
                if (option.image != undefined) {
                  if (option.image.assetId && option.image.isValid) {
                    item.options[i].value.asset = option.image.assetId;
                    item.media.push({
                      id: option.image.assetId,
                      src: option.image.urls[env],
                      type: 'image'
                    });
                  }
                }


              });
              item.model.mcqType = question.mcqType;
              break;
            }
          case "mfr":
            {
              item.keywords = ['mfr'];
              item.type = 'ftb';
              item.template_id = 'org.ekstep.plugins.funtoot.genericmfr';
              item.template = 'org.ekstep.plugins.funtoot.genericmfr';
              item.model.fibs = [];
              item.model.steps = [];
              question.fibs.forEach(function (fib, i) {
                item.model.fibs.push(fib);
              });
              break;
            }
          case "mdd":
            {
              item.keywords = ['mdd'];
              item.type = 'ftb';
              item.template_id = 'org.ekstep.plugins.funtoot.genericmdd';
              item.template = 'org.ekstep.plugins.funtoot.genericmdd';
              item.model.dropDowns = [];
              _.each(question.dropDowns, function (dropDown, i) {
                item.model.dropDowns.push({
                  'identifier': dropDown.identifier,
                  'options': []
                })

                _.each(dropDown.options, function (option, opt_i) {
                  var image = null;
                  if (option.image && option.image.assetId && option.image.isValid) {
                    image = option.image.assetId;
                    item.media.push({
                      id: image,
                      src: option.image.urls[env],
                      type: 'image'
                    });
                  }
                  item.model.dropDowns[i].options.push({
                    'text': option.text,
                    'mh': option.mh,
                    'mmc': option.mmc,
                    'answer': option.answer,
                    'image': image
                  });
                });
              });
              break;
            }
          case "mtf":
            {
              item.keywords = ['mtf'];
              item.type = 'mtf';
              item.template_id = 'org.ekstep.plugins.funtoot.genericmtf';
              item.template = 'org.ekstep.plugins.funtoot.genericmtf';
              item.model.map = question.map;
              item.model.premises = [];
              item.lhs_options = [];
              item.rhs_options = [];
              item.model.responses = [];
              _.each(question.premises, function (premise, i) {
                item.lhs_options.push(quesTemplate.lhsOptionTemplate());
                var image = null;
                if (premise.image && premise.image.assetId && premise.image.isValid) {
                  image = premise.image.assetId;
                  item.media.push({
                    id: premise.image.assetId,
                    src: premise.image.urls[env],
                    type: 'image'
                  });
                }
                item.model.premises.push({
                  'text': premise.text,
                  'image': image,
                  'mh': premise.mh,
                  'mmc': premise.mmc,
                  'identifier': premise.identifier
                });
                item.lhs_options[i].value.type = image ? 'image' : 'text';
                item.lhs_options[i].value.asset = image ? image : premise.text;
                item.lhs_options[i].index = Number(premise.identifier);
                item.lhs_options[i].mh = premise.mh;
                item.lhs_options[i].mmc = premise.mmc;

              })

              _.each(question.responses, function (response, i) {
                item.rhs_options.push(quesTemplate.rhsOptionTemplate());
                var image = null;
                if (response.image && response.image.assetId && response.image.isValid) {
                  image = response.image.assetId;
                  item.media.push({
                    id: response.image.assetId,
                    src: response.image.urls[env],
                    type: 'image'
                  });
                }
                item.model.responses.push({
                  'text': response.text,
                  'image': image,
                  'mh': response.mh,
                  'mmc': response.mmc,
                  'identifier': response.identifier
                });
                item.rhs_options[i].value.type = response.text ? 'text' : 'image';
                item.rhs_options[i].value.asset = response.text ? response.text : image;
                item.rhs_options[i].answer = Number(response.identifier);
              })
              break;
            }
          case "Sequencing":
            {
              console.log('-----------------------------Im here----------------------------------')
              item.keywords = ['Sequencing'];
              item.type = 'ftb';
              item.template_id = 'org.ekstep.plugins.funtoot.genericsequencing';
              item.template = 'org.ekstep.plugins.funtoot.genericsequencing';
              item.model.seqSteps = [];
              _.each(question.seqSteps, function (seqStep, i) {
                var image = null;
                if (seqStep.image && seqStep.image.assetId && seqStep.image.isValid) {
                  image = seqStep.image.assetId;
                  item.media.push({
                    id: seqStep.image.assetId,
                    src: seqStep.image.urls[env],
                    type: 'image'
                  });
                }
                item.model.seqSteps.push({
                  'identifier': seqStep.identifier,
                  'text': seqStep.text,
                  'image': image,
                  'mh': seqStep.mh,
                  'mmc': seqStep.mmc
                })
              })
              break;
            }
          case "freeResponse":
            {
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

        var reqBody = {
          "request": {
            "assessment_item": {}
          }
        };
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
          if (response.statusCode == 200 || response.statusCode == 400 || response.statusCode == 500) {
            if (data.params && data.params.errmsg) {
              if (data.params.errmsg.indexOf("Object already exists with identifier") !== -1) {
                console.log(item.code + ' already exists. Updating..')
                url = url + 'update/' + item.code;
                //console.log(JSON.stringify(args));
                client.patch(url, args, function (data, response) {
                  if (response.statusCode == 200) {
                    messages[qid] = {
                      message: 'Published',
                      statusCode: response.statusCode
                    };
                    /* if (env == 'prod')
                      updateItemStatus(question._id, 'Published'); */
                    publishQuestion(qIds, env, messages, res, response.statusCode);
                  } else {
                    messages[qid] = {
                      message: err,
                      statusCode: response.statusCode
                    };
                    publishQuestion(qIds, env, messages, res, response.statusCode);
                  }
                }).on('error', function (err) {
                  messages[qid] = {
                    message: err,
                    statusCode: response.statusCode
                  };
                  publishQuestion(qIds, env, messages, res, response.statusCode);
                });
              } else {
                messages[qid] = {
                  message: data.params,
                  statusCode: response.statusCode
                };
                publishQuestion(qIds, env, messages, res, response.statusCode);
              }
            } else {
              messages[qid] = {
                message: 'Published',
                statusCode: response.statusCode
              };
              publishQuestion(qIds, env, messages, res, response.statusCode);
            }
          } else {
            messages[qid] = {
              message: data,
              statusCode: response.statusCode
            };
            publishQuestion(qIds, env, messages, res, response.statusCode);
          }
        }).on('error', function (err) {
          messages[qid] = {
            message: err,
            statusCode: ''
          };
          publishQuestion(qIds, env, messages, res, 501);
        });
      });
    }
  });
}

exports.publish = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  var qIds = req.body;
  var messages = {};
  var env = req.params.env;
  publishQuestion(qIds, env, messages, res, 200);
}

exports.translate = function (req, res) {
  Question.findOne({
    'identifier': req.params.id
  })
    .lean()
    .exec(function (err, question) {
      if (err) {
        res.status(500).json(err);
      } else if (!question) {
        res.status(404).send('Not Found');
      } else {
        if (question.qtype == 'legacy-word-problem') {
          res.status(415).send({
            'err': 'legacy word problems not supported for translation'
          });
          return;
        }
        var requestedLang = req.params.target_language;
        var transTextKeyArray = [];
        var transTextArray = [];

        for (var key in question.i18n.en) {
          if (question.i18n.en.hasOwnProperty(key)) {
            transTextKeyArray.push(key);
            if (question.i18n.en[key]) {
              transTextArray.push(question.i18n.en[key]);
            } else {
              transTextArray.push('');
            }
          }
        }

        Translate.translate(transTextArray, requestedLang, function (err, results) {
          if (err) {
            res.status(err.code).json(transTextArray);
          } else {
            var resObj = {};
            _.each(transTextKeyArray, function (key, i) {
              resObj[key] = results[i];
            })
            res.status(200).json(resObj);
          }
        })
      }
    });
}
