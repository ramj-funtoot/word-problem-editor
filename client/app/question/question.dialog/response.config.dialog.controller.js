'use strict';

angular.module('wpappApp')
  .controller('ResponseConfigDialogCtrl', function ($scope, step, i18n, qtype, $mdConstant, $mdDialog) {
    $scope.meta = {
      unitPlacements: ['pre', 'post']
    };
    $scope.step = step;
    $scope.i18n = i18n;
    $scope.qtype = qtype;
    $scope.langId = 'en';
    $scope.closeDialog = function () {
      $mdDialog.cancel();
    };
    $scope.addNewResponse = function ($event, index) {
      var max = $scope.step.responses.length;
      var stepNumber = $scope.step.responses[0].mh.substring(13, 14)
      if ($scope.qtype == "legacy-word-problem")
        stepNumber = $scope.step.responses[0].mh.slice(-1);
      $scope.step.responses.push({
        default: false,
        response: '',
        mmc: [],
        mh: 'RESPONSE_MSG_' + stepNumber + '_' + max
      });
    }
    $scope.save = function ($event) {
      $mdDialog.hide($scope.step);
    }

    $scope.deleteResponse = function ($event, index) {
      var confirm = $mdDialog.confirm()
        .title('Confirm Delete Response')
        .textContent('Are you sure you want to delete the response pattern?')
        .ariaLabel('Delete response')
        .targetEvent($event)
        .ok('Yes')
        .cancel('No')
        .multiple(true);
      $mdDialog.show(confirm).then(function () {
        $scope.step.responses.splice(index, 1);
        var stepNumber = $scope.step.responses[0].mh.split("_")[2]
        if ($scope.qtype == "legacy-word-problem")
            stepNumber = $scope.step.responses[0].mh.slice(-1);
        $scope.step.responses.forEach(function (r) {
          if (parseInt(r.mh.slice(-1)) > index) {
            var d = parseInt(r.mh.split("_")[3]);
            d = d - 1;

            var s = r.mh.split("_")
            r.mh = s[0] + "_" + s[1] + "_" + stepNumber + "_" + d;
          }
        });
        delete $scope.i18n["en"]["RESPONSE_MSG_" + stepNumber + "_" + index]
        //Update i18n
        for (var i = index + 1; $scope.i18n["en"]["RESPONSE_MSG_" + stepNumber + "_" + i] != undefined; i++) {
          var str = $scope.i18n["en"]["RESPONSE_MSG_" + stepNumber + "_" + i];
          var r = i - 1;
          $scope.i18n["en"]["RESPONSE_MSG_" + stepNumber + "_" + r] = str;
          delete $scope.i18n["en"]["RESPONSE_MSG_" + stepNumber + "_" + i]
        }
      }, function () {});
    }
  });
