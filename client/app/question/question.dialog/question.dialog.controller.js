'use strict';

angular.module('wpappApp')
  .controller('QuestionDialogCtrl', function ($scope, item, users, $mdConstant, $mdDialog, Auth, $http, ItemTemplateService) {
    $scope.isMCQAnswerSet = false;
    $scope.item = item || ItemTemplateService.getDefaultItem('legacy-word-problem');
    $scope.langId = 'en';
    $scope.users = users;

    $scope.meta = {
      grades: [1, 2, 3, 4, 5],
      btlos: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
      diffLevels: [1, 2, 3, 4, 5],
      states: ['Draft', 'In-Review', 'Reviewed', 'Ready For Publish', 'Published', 'Rejected'],
      es_diffLevels: ['EASY', 'MEDIUM', 'HARD', 'RARE'],
      attempts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      levels: [1, 2, 3, 4, 5, 6],
      sub_levels: [1, 2, 3, 4, 5, 6],
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
        $scope.item.updated = { by: user.email };
        $mdDialog.hide($scope.item);
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
        }
        else {
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

    $scope.getDisplayableTime = function (time) {
      return moment(time).fromNow();
    }
  });

angular.module('wpappApp')
  .controller('MCQOptionsCtrl', function ($scope) {
    $scope.images = { optionImages: [] };
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
            $scope.item.options[i].image = { base64: null, assetId: '', isValid: true };
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
