'use strict';

angular.module('wpappApp')
  .controller('QuestionDialogCtrl', function ($scope, item, users, $mdConstant, $mdDialog, Auth, $http, ItemTemplateService) {
    $scope.isMCQAnswerSet = false;
    $scope.item = item || ItemTemplateService.getDefaultItem('legacy-word-problem');
    $scope.langId = 'en';
    var langId = $scope.langId;
    $scope.users = users;

    _.each($scope.item.options, function (o) {
      if (o.mmc === null && o.answer == false)
        o.mmc = [];
    });

    $scope.meta = {
      grades: [1, 2, 3, 4, 5],
      btlos: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
      diffLevels: [1, 2, 3, 4, 5],
      states: ['Draft', 'In-Review', 'Reviewed', 'Ready For Publish', 'Published', 'Rejected', 'Verified'],
      es_diffLevels: ['EASY', 'MEDIUM', 'HARD', 'RARE'],
      attempts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      levels: [1, 2, 3, 4, 5, 6],
      sub_levels: [1, 2, 3, 4, 5, 6],
      mcqType: [1, 2, 3, 5, 6, 7, 8, 9],
      mcqTypeTemplateImages: [
        'assets/images/mcq-type-1.png',
        'assets/images/mcq-type-2.png',
        'assets/images/mcq-type-3.png',
        'assets/images/mcq-type-4.png',
        'assets/images/mcq-type-5.png',
        'assets/images/mcq-type-6.png',
        'assets/images/mcq-type-7.png',
        'assets/images/mcq-type-8.png',
        'assets/images/mcq-type-9.png'
      ],
      locales: [{
          id: 'en',
          name: 'English'
        },
        {
          id: 'mr',
          name: 'Marathi'
        }
      ],
      validate: function () {
        return true;
      }
    };

    $scope.keys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.COMMA];

    $scope.closeDialog = function () {
      $mdDialog.cancel();
    };

    // child controllers must implement this
    //$scope.validate = function () { return true; };

    $scope.saveQuestion = function ($event) {
      if ($scope.meta.validate()) {
        var user = Auth.getCurrentUser();
        $scope.item.updated = {
          by: user.email
        };
        $mdDialog.hide($scope.item);
      }
    }

    $scope.showOptions = function($event, dD){
      var parentEl = angular.element(document.body);
      $mdDialog.show({
        parent: parentEl,
        targetEvent: $event,
        templateUrl: 'app/question/question.dialog/options.config.dialog.html',
        locals: {
          dD: angular.copy(dD),
          i18n: item.i18n || {},
          qtype: item.qtype
        },
        multiple: true,
        controller: 'OptionsConfigDialogCtrl'
      }).then(function (updatedDD) {
        console.log('dD', updatedDD);
        angular.extend(dD, updatedDD);
      });
    }

    $scope.langChange = function ($event) {
      console.log($scope.langId);
      if ($scope.item.i18n.hasOwnProperty($scope.langId)) {
        console.log('language exists i18n');
      } else {
        $http.get('/api/questions/translate/' + $scope.item.identifier + '/' + $scope.langId).then(function (response) {
          console.log(response.data);
          $scope.item.i18n[$scope.langId] = response.data;
        }).catch(function (error) {
          $scope.message = "No items to show!";
          console.log(error);
        });
      }
    }

    $scope.images = {
      qImage: null,
      optionImages: []
    }

    $scope.$watch(function () {
      return $scope.images.qImage;
    }, function (n, o) {
      if (n && n.filetype && n.base64) {
        if (!$scope.item.questionImage)
          $scope.item.questionImage = [];
        else if ($scope.item.questionImage.length == 0) {
          $scope.item.questionImage.push({
            base64: 'data:' + n.filetype + ';base64,' + n.base64,
            assetId: '',
            isValid: true
          });
        } else {
          $scope.item.questionImage[0].base64 = 'data:' + n.filetype + ';base64,' + n.base64;
          $scope.item.questionImage[0].isValid = true;
        }
      }
    }, true);

    $scope.configResponses = function ($event, step) {
      var parentEl = angular.element(document.body);
      $mdDialog.show({
        parent: parentEl,
        targetEvent: $event,
        templateUrl: 'app/question/question.dialog/response.config.dialog.html',
        locals: {
          step: angular.copy(step),
          i18n: item.i18n || {},
          qtype: item.qtype
        },
        multiple: true,
        controller: 'ResponseConfigDialogCtrl'
      }).then(function (updatedStep) {
        console.log('step', updatedStep);
        angular.extend(step, updatedStep);
      });
    }


    $scope.addComment = function () {
      var user = Auth.getCurrentUser();
      if (!$scope.item.comments)
        $scope.item.comments = [];
      $scope.item.comments.push({
        commentedBy: user[user.provider].displayName,
        comment: $scope.userComment
      });
      $scope.userComment = '';
    }

    $scope.addNewOption = function ($event, index) {
      var max = 0;
      Object.keys(item.i18n["en"]).forEach(function (k) {
        if (k.slice(0, 3) == "MH_") {
          if (max < k.slice(-1)) {
            max = k.slice(-1)
          }
        }
      });
      max++;
      $scope.item.options.push({
        image: null,
        text: 'OPT_' + max,
        answer: false,
        mh: 'MH_' + max,
        mmc: []
      });
    }

    $scope.deleteQimage = function ($event) {
      var confirm = $mdDialog.confirm()
        .title('Sure?')
        .textContent('Are you sure you want to delete the question image?')
        .ariaLabel('Delete Image')
        .targetEvent($event)
        .ok('No')
        .cancel('Yes')
        .multiple(true);
      $mdDialog.show(confirm).then(function () {}, function () {
        $scope.item.questionImage[0].isValid = false;
        $scope.item.questionImage[0].assetId = "";
        $scope.item.questionImage[0].URL = {};
      });
    };

    $scope.deletePremiseAndResponse = function($event, index){
      var confirm = $mdDialog.confirm()
      .title('Sure?')
      .textContent('Are you sure you want to delete Premise & Response of Id #'+ index + '?')
      .ariaLabel('Delete Premise & Response')
      .targetEvent($event)
      .ok('No')
      .cancel('Yes')
      .multiple(true);
    $mdDialog.show(confirm).then(function () {}, function () {
      //renaming premise and response text for i18n and micro hint upon deletion
      $scope.item.premises.splice(index, 1);
      $scope.item.responses.splice(index, 1);

      _.each($scope.item.premises, function(premise){
        if(premise.identifier > index){
          var newId = premise.identifier - 1;
          premise.identifier = newId;
          if(premise.text != null && premise.text != undefined && premise.text.length != 0){
            premise.text = 'premise_' + ( +newId + 1 );
            $scope.item.i18n.en[premise.text] = $scope.item.i18n.en['premise_' + ( +newId + 2 )];
            delete $scope.item.i18n.en['premise_' + ( +newId + 2 )];
          }
          if(premise.mh != null && premise.mh != undefined && premise.mh.length != 0){
            premise.mh = 'mh_' + ( +newId + 1 );
            $scope.item.i18n.en[premise.mh] = $scope.item.i18n.en['mh_' + ( +newId + 2 )];
            delete  $scope.item.i18n.en['mh_' +( +newId + 2 )];
          }
        }
      })

      _.each($scope.item.responses, function(response){
        if(response.identifier > index){
          var newId = response.identifier - 1;
          response.identifier = newId;
          if(response.text != null && response.text != undefined && response.text.length != 0){
            response.text = 'response_' + ( +newId + 1 ) + '_1';
            $scope.item.i18n.en[response.text] = $scope.item.i18n.en['response_' + ( +newId + 2 ) + '_1'];
            delete $scope.item.i18n.en['response_' + ( +newId + 2 ) + '_1'];
          }
          if(response.mh != null && response.mh != undefined && response.mh.length != 0){
            response.mh = 'mh_' + ( +newId + 1 ) + '_1';
            $scope.item.i18n.en[response.mh] = $scope.item.i18n.en['mh_' + ( +newId + 2 ) + '_1'];
            delete  $scope.item.i18n.en['mh_' +( +newId + 2 ) + '_1'];
          }
        }
      })

       //change mappings upon deleting
       $scope.item.map.splice(index, 1);
       _.each($scope.item.map, function(m, i){
          if(m.premise[0] > index){
            m.premise[0] = m.premise[0] - 1;
            m.response[0] = "" +  (+m.response[0] - 1);
          }
       })

    });
      
       
    }

    $scope.addPremiseAndResponse = function($event){
      var newId = "" + $scope.item.premises.length;
      $scope.item.premises.push({
        identifier : newId,
        text : "premise_" + ( +newId + 1 ),
        image : null,
        mh : "mh_" + ( +newId + 1 ),
        mmc : []
      })
      $scope.item.responses.push({
        identifier : newId,
        text : "response_" + ( +newId + 1 ) + '_1',
        image : null,
        mh : "mh_" + ( +newId + 1 ) + '_1',
        mmc : []
      })

      $scope.item.map.push({
        'premise' : [newId],
        'response': [newId]
      })
    }

    $scope.deletePremiseImage = function ($event, index) {
      var confirm = $mdDialog.confirm()
        .title('Sure?')
        .textContent('Are you sure you want to delete this Premise image?')
        .ariaLabel('Delete Image')
        .targetEvent($event)
        .ok('No')
        .cancel('Yes')
        .multiple(true);
      $mdDialog.show(confirm).then(function () {}, function () {
        $scope.item.premises[index].image.isValid = false;
      });
    };
  
    $scope.deleteResponseImage = function ($event, index) {
      var confirm = $mdDialog.confirm()
        .title('Sure?')
        .textContent('Are you sure you want to delete this Premise image?')
        .ariaLabel('Delete Image')
        .targetEvent($event)
        .ok('No')
        .cancel('Yes')
        .multiple(true);
      $mdDialog.show(confirm).then(function () {}, function () {
        $scope.item.responses[index].image.isValid = false;
      });
    };
    

    $scope.deleteOptionImage = function ($event, index) {
      var confirm = $mdDialog.confirm()
        .title('Sure?')
        .textContent('Are you sure you want to delete this option image?')
        .ariaLabel('Delete Image')
        .targetEvent($event)
        .ok('No')
        .cancel('Yes')
        .multiple(true);
      $mdDialog.show(confirm).then(function () {}, function () {
        $scope.item.options[index].image.isValid = false;
      });
    };

    $scope.deleteOption = function ($event, index) {
      var confirm = $mdDialog.confirm()
        .title('Confirm Delete Option')
        .textContent('Are you sure you want to delete this option?')
        .ariaLabel('Delete Option')
        .targetEvent($event)
        .ok('Yes')
        .cancel('No')
        .multiple(true);
      $mdDialog.show(confirm).then(function () {
        //Remove particular option
        $scope.item.options.splice(index, 1);
        //Update remaining options
        $scope.item.options.forEach(function (o) {
          if (parseInt(o.mh.slice(-1)) > index) {
            var d = parseInt(o.mh.split("_")[1]);
            d = d - 1;

            var s = o.mh.split("_")[0]
            o.mh = s + "_" + d;

            s = o.text.split("_")[0]
            o.text = s + "_" + d;
          }
        })
        delete item.i18n["en"]["MH_" + index]
        delete item.i18n["en"]["OPT_" + index]
        //Update i18n
        for (var i = index + 1; item.i18n["en"]["MH_" + i] != undefined && item.i18n["en"]["OPT_" + i] != undefined; i++) {
          var str = item.i18n["en"]["MH_" + i];
          var r = i - 1;
          item.i18n["en"]["MH_" + r] = str;
          delete item.i18n["en"]["MH_" + i]

          str = item.i18n["en"]["OPT_" + i];
          item.i18n["en"]["OPT_" + r] = str;
          delete item.i18n["en"]["OPT_" + i]
        }
      }, function () {});
    }


    $scope.getDisplayableTime = function (time) {
      return moment(time).fromNow();
    }
  });


angular.module('wpappApp').controller('MTFPremRespCtrl', function($scope){
  $scope.images = {
    premiseImages: [],
    responseImages: []
  };

  $scope.premRespMapObj = {};
  $scope.responseArray = [];

  var init = function () {
    
    _.each($scope.item.premises, function (o, i) {
      $scope.images.premiseImages.push({});
    });
    
    _.each($scope.item.responses, function (r, i) {
      $scope.images.responseImages.push({});
      $scope.responseArray.push(r.identifier);
    });

    //as currently each premise have a single response, Current MTF Does not allow 
      //a single premise to have multiple responses as answer
    _.each($scope.item.map, function(m){
      $scope.premRespMapObj[m.premise[0]] = m.response[0]
    })

  

  }();

  

  $scope.$watch(function () {
    return $scope.images.premiseImages;
  }, function (n, o) {
    _.each($scope.images.premiseImages, function (img, i) {
      if (img.base64) {
        if (!$scope.item.premises[i].image)
          $scope.item.premises[i].image = {
            base64: null,
            assetId: '',
            isValid: true
          };
        $scope.item.premises[i].image.base64 = 'data:' + img.filetype + ';base64,' + img.base64;
        $scope.item.premises[i].image.isValid = true;
      }
    });
  }, true);

  $scope.$watch(function () {
    return $scope.images.responseImages;
  }, function (n, o) {
    _.each($scope.images.responseImages, function (img, i) {
      if (img.base64) {
        if (!$scope.item.responses[i].image)
          $scope.item.responses[i].image = {
            base64: null,
            assetId: '',
            isValid: true
          };
        $scope.item.responses[i].image.base64 = 'data:' + img.filetype + ';base64,' + img.base64;
        $scope.item.responses[i].image.isValid = true;
      }
    });
  }, true);


  $scope.updateMapping = function(event, index){
    _.each($scope.item.map, function(m){
      if(m.premise[0] == $scope.item.premises[index].identifier){
        m.response[0] = $scope.premRespMapObj[m.premise[0]];
      }
    })
    
  }




})

angular.module('wpappApp')
  .controller('MCQOptionsCtrl', function ($scope) {
    $scope.images = {
      optionImages: []
    };
    var init = function () {
      _.each($scope.item.options, function (o, i) {
        $scope.images.optionImages.push({});
      });
    }();
    $scope.toggleSelection = function (option) {
      //option.answer = !option.answer;
      /*if ($scope.isMCQAnswerSet && !option.answer) {
        var r = confirm("Please deselect already selected option to choose another");
      }
      else {
        option.answer ? (option.answer = false, $scope.isMCQAnswerSet = false) : (option.answer = true, $scope.isMCQAnswerSet = true);
      }*/
    }


    $scope.meta.validate = function () {
      if (!_.some($scope.item.options, 'answer')) {
        confirm("Please select an answer for MCQ to save");
        return false;
      }
      return true;
    }

    $scope.$watch(function () {
      return $scope.images.optionImages;
    }, function (n, o) {
      _.each($scope.images.optionImages, function (img, i) {
        if (img.base64) {
          if (!$scope.item.options[i].image)
            $scope.item.options[i].image = {
              base64: null,
              assetId: '',
              isValid: true
            };
          $scope.item.options[i].image.base64 = 'data:' + img.filetype + ';base64,' + img.base64;
          $scope.item.options[i].image.isValid = true;
        }
      });
    }, true);
  });

angular.module('wpappApp')
  .controller('WordProblemCtrl', function ($scope) {
    $scope.meta.validate = function () {
      return true;
    }
  });

angular.module('wpappApp')
  .controller('FreeResponseCtrl', function ($scope) {
    $scope.meta.validate = function () {
      return true;
    }
  });
