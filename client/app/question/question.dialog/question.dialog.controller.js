'use strict';

angular.module('wpappApp')
  .controller('QuestionDialogCtrl', function ($scope, item, users, $mdConstant, $mdDialog, Auth, $http, ItemTemplateService) {
    $scope.isMCQAnswerSet = false;
    $scope.item = item || ItemTemplateService.getDefaultItem('legacy-word-problem');
    $scope.langId = 'en';
    var langId = $scope.langId;
    $scope.users = users;

    $scope.meta = {
      grades: [1, 2, 3, 4, 5],
      btlos: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
      diffLevels: [1, 2, 3, 4, 5],
      states: ['Draft', 'In-Review', 'Reviewed', 'Ready For Publish', 'Published', 'Rejected', 'Verified'],
      es_diffLevels: ['EASY', 'MEDIUM', 'HARD', 'RARE'],
      attempts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      levels: [1, 2, 3, 4, 5, 6],
      sub_levels: [1, 2, 3, 4, 5, 6],
      mcqType: [1, 2, 3, 4, 5, 6, 7, 8],
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

    $scope.deleteOption = function ($event, index) {
      var confirm = $mdDialog.confirm()
        .title('Confirm Delete Option')
        .textContent('Are you sure you want to delete this option?')
        .ariaLabel('Delete option')
        .targetEvent($event)
        .ok('Yes')
        .cancel('No')
        .multiple(true);
      $mdDialog.show(confirm).then(function () {
        //Remove particular option
        console.log("following was option removed :", $scope.item.options[index])
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
      }, function () { });
    }


    $scope.getDisplayableTime = function (time) {
      return moment(time).fromNow();
    }
  });

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
