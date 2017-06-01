'use strict';

angular.module('wpappApp')
  .controller('QuestionDialogCtrl', function ($scope, item, $mdConstant, $mdDialog, Auth) {
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
          "expressions": [
            ""
          ],
          "comments": [
            {
              "commentedBy": "",
              "comment": ""
            }
          ]
        }
      ]
    };
    $scope.keys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.COMMA];
    $scope.closeDialog = function () {
      $mdDialog.cancel();
    };
    $scope.saveQuestion = function ($event) {
      // if the owner is not set, set it now. Update the 'updated' info
      var user = Auth.getCurrentUser();
      if (!$scope.item.owner) $scope.item.owner = user.email;
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
