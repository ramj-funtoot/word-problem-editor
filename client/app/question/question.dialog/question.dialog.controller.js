'use strict';

angular.module('wpappApp')
  .controller('QuestionDialogCtrl', function ($scope, item, users, $mdConstant, $mdDialog, Auth, $http, ItemTemplateService) {
    $scope.isMCQAnswerSet = false;
    $scope.item = item || ItemTemplateService.getDefaultItem('legacy-word-problem');
    $scope.langId = 'en';
    $scope.users = users;

    var init = function () {
    }();

    $scope.meta = {
      grades: [1, 2, 3, 4, 5],
      btlos: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
      diffLevels: [1, 2, 3, 4, 5],
      states: ['Draft', 'In-Review', 'Reviewed', 'Ready For Publish', 'Published', 'Rejected'],
      es_diffLevels: ['EASY', 'MEDIUM', 'HARD', 'RARE'],
      attempts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      levels: [1, 2, 3, 4, 5, 6],
      sub_levels: [1, 2, 3, 4, 5, 6]
    };

    $scope.keys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.COMMA];

    $scope.closeDialog = function () {
      $mdDialog.cancel();
    };

    // child controllers must implement this
    $scope.validate = function () { return true; };

    $scope.saveQuestion = function ($event) {
      if ($scope.validate()) {
        var user = Auth.getCurrentUser();
        $scope.item.updated = { by: user.email };
        $mdDialog.hide($scope.item);
      }
    }

    $scope.$watch('questionImage', function (n, o) {
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
    });

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
  .controller('MCQOptionsCtrl', function ($scope, item, users, $mdConstant, $mdDialog, Auth, $http) {
    $scope.optionImages = [];
    var init = function () {
      _.each($scope.item.options, function (o, i) {
        $scope.optionImages.push(o.image.base64);
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

    $scope.validate = function () {
      if (!_.some(item.options, 'answer')) {
        confirm("Please select an answer for MCQ to save");
        return false;
      }
      return true;
    }

    $scope.$watch('optionImages', function (n, o) {
      _.each($scope.optionImages, function (img, i) {
        $scope.item.option[i].image.base64 = 'data:' + n[i].filetype + ';base64,' + n[i].base64;
        $scope.item.option[i].image.isValid = true;
      });
    }, true);
  });

angular.module('wpappApp')
  .controller('WordProblemCtrl', function ($scope, item, users, $mdConstant, $mdDialog, Auth, $http) {
    $scope.validate = function () {
      return true;
    }
  });

angular.module('wpappApp')
  .controller('FreeResponseCtrl', function ($scope, item, users, $mdConstant, $mdDialog, Auth, $http) {
    $scope.validate = function () {
      return true;
    }
  });
