'use strict';

angular.module('wpappApp')
  .controller('QuestionDialogCtrl', function ($scope, item, users, $mdConstant, $mdDialog, Auth) {
    $scope.item = item || {
      "identifier": "",
      "grade": "2",
      "level": 0,
      "subLevel": 1,
      "btlo": "Remember",
      "difficultyLevel": "1",
      "conceptCode": "C12",
      "active": true,
      "owner": "",
      "state": "Draft",
      "maxAttempts": 1,
      "questionText": "",
      "steps": [
        {
          "text": "",
          "answer": "",
          "responses": [
            {
              "default": true,
              "response": "",
              "mmc": [],
              "mh": ""
            }
          ],
          "hintText": "",
          "solutionText": "",
          "expressions": '',
          "comments": [
            {
              "commentedBy": "",
              "comment": ""
            }
          ]
        }
      ]
    };

    $scope.users = users;

    var init = function () {
    }();

    $scope.meta = {
      grades: [1, 2, 3, 4, 5],
      btlos: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
      diffLevels: [1, 2, 3, 4, 5],
      states: ['Draft', 'In-Review', 'Published', 'Rejected'],
      es_diffLevels: ['EASY', 'MEDIUM', 'HARD', 'RARE'],
      attempts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    };

    $scope.keys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.COMMA];

    $scope.closeDialog = function () {
      $mdDialog.cancel();
    };

    $scope.saveQuestion = function ($event) {
      var user = Auth.getCurrentUser();
      $scope.item.updated = { by: user.email }
      $mdDialog.hide($scope.item);
    }

    $scope.$watch('questionImage', function (n, o) {
      if (n && n.filetype && n.base64) {
        $scope.item.questionImage = 'data:' + n.filetype + ';base64,' + n.base64;
      }
    });

    $scope.configResponses = function ($event, step) {
      var parentEl = angular.element(document.body);
      $mdDialog.show({
        parent: parentEl,
        targetEvent: $event,
        templateUrl: 'app/question/question.dialog/response.config.dialog.html',
        locals: {
          step: angular.copy(step)
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
