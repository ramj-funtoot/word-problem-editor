'use strict';

angular.module('wpappApp')
  .controller('QuestionDialogCtrl', function ($scope, item, users, $mdConstant, $mdDialog, Auth) {

    $scope.loadJSON = function (callback) {
      var xobj = new XMLHttpRequest();
      xobj.overrideMimeType("application/json");
      xobj.open('GET', '/app/question/question.dialog/modeltemps.json', true); // Replace 'my_data' with the path to your file
      xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
          // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
          callback(xobj.responseText);
        }
      };
      xobj.send(null);
    };
    $scope.getJSONObj = function (response) {
      $scope.mongoModelJSON = JSON.parse(response);
    };
    $scope.isMCQAnswerSet = false;
    $scope.loadJSON($scope.getJSONObj);

    switch (item.qtype) {
      case "legacy-word-problem":
        $scope.item = item || $scope.mongoModelJSON.wpmongomodel;
        break;
      case "mcq":
        $scope.item = item || $scope.mongoModelJSON.mcqmongomodel;
        var answerSet = _.filter($scope.item.options, { 'answer': true });
        $scope.isMCQAnswerSet = answerSet.length > 0 ? true : false;
        break;
      case "freeResponse":
        $scope.item = item || $scope.mongoModelJSON.freeResponsemongomodel;
        break;
    };

    $scope.langId = 'en';
    $scope.users = users;

    var init = function () {
    }();

    $scope.meta = {
      grades: [1, 2, 3, 4, 5],
      btlos: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
      diffLevels: [1, 2, 3, 4, 5],
      states: ['Draft', 'In-Review', 'Published', 'Rejected'],
      es_diffLevels: ['EASY', 'MEDIUM', 'HARD', 'RARE'],
      attempts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      levels: [1, 2, 3, 4, 5, 6],
      sub_levels: [1, 2, 3, 4, 5, 6]
    };

    $scope.keys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.COMMA];

    $scope.closeDialog = function () {
      $mdDialog.cancel();
    };
    $scope.toggleSelection = function (option) {
      if ($scope.isMCQAnswerSet && !option.answer) {
        var r = confirm("Please deselect already selected option to choose another");
      }
      else {
        option.answer ? (option.answer = false, $scope.isMCQAnswerSet = false) : (option.answer = true, $scope.isMCQAnswerSet = true);
      }
    };
    $scope.saveQuestion = function ($event) {
      if ($scope.item.qtype == "mcq" && !$scope.isMCQAnswerSet) {
        var r = confirm("Please select an answer for MCQ to save");
      }
      else {
        var user = Auth.getCurrentUser();
        $scope.item.updated = { by: user.email };
        $mdDialog.hide($scope.item);
      }
    }

    $scope.$watch('questionImage', function (n, o) {
      if (n && n.filetype && n.base64) {
        if ($scope.item.questionImage)
          $scope.item.questionImage = 'data:' + n.filetype + ';base64,' + n.base64;
        else if ($scope.item.questionImages) {
          $scope.item.questionImages = [];
          $scope.item.questionImages.push('data:' + n.filetype + ';base64,' + n.base64)
        }
      }
    });
    $scope.$watch('optionImage', function (n, o) {
      if (n && n.filetype && n.base64) {
        if ($scope.item.option.image)
          $scope.item.option.image = 'data:' + n.filetype + ';base64,' + n.base64;
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
