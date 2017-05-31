'use strict';

angular.module('wpappApp')
    .controller('ResponseConfigDialogCtrl', function ($scope, step, $mdConstant, $mdDialog) {
        $scope.step = step;
        $scope.closeDialog = function () {
            $mdDialog.cancel();
        };
        $scope.addNewResponse = function ($event, index) {
            $scope.step.responses.push({ response: '', mmc: [], mh: '' });
        }
        $scope.save = function ($event) {
            $mdDialog.hide($scope.step);
        }
    });
