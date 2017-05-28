'use strict';

angular.module('wpappApp')
  .controller('QuestionDialogCtrl', function ($scope, item, $mdConstant, $mdDialog) {
    $scope.item = item || {
      "identifier": "id",
      "grade": "2",
      "level": 0,
      "subLevel": 1,
      "btlo": "Remember",
      "difficultyLevel": "1",
      "conceptCode": "C12",
      "active": true,
      "owner": "ram",
      "state": "Draft",
      "maxAttempts": 10,
      "questionText": "asd",
      "steps": [
        {
          "text": "asdddd",
          "answer": "adbd",
          "responses": [
            {
              "response": "abcd",
              "mmc": [
                "C234"
              ],
              "mh": "abdsdf"
            }
          ],
          "hintText": "hint text",
          "solutionText": "",
          "expressions": [
            ""
          ],
          "comments": [
            {
              "commentedBy": "ram"
            }
          ]
        }
      ]
    };
    $scope.keys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.COMMA];
    $scope.closeDialog = function () {
      $mdDialog.cancel();
    };
    $scope.addNewResponse = function ($event, index) {
      $scope.item.steps[index].responses.push({ response: '' });
    }
    $scope.addQuestion = function ($event) {
      $mdDialog.hide($scope.item);
    }
    $scope.$watch('questionImage', function (n, o) {
      if (n && n.filetype && n.base64) {
        $scope.item.questionImage = 'data:' + n.filetype + ';base64,' + n.base64;
      }
    });
  });
