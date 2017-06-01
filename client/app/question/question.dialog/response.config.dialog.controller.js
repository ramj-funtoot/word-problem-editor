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

        $scope.deleteResponse = function ($event, index) {
            var confirm = $mdDialog.confirm()
                .title('Confirm Delete Response')
                .textContent('Are you sure you want to delete the response patter?')
                .ariaLabel('Delete response')
                .targetEvent($event)
                .ok('Yes')
                .cancel('No')
                .multiple(true);
            $mdDialog.show(confirm).then(function () {
                $scope.step.responses.splice(index, 1);
            }, function () {
            });
        }
    });
