'use strict';

angular.module('wpappApp')
  .controller('QuestionCtrl', function ($scope, $http, $mdDialog) {
    $scope.refresh = function () {
      $http.get('/api/questions').then(function (response) {
        $scope.items = response.data;
      }).catch(function (error) {
        $scope.message = "No items to show!";
      });
    }

    $scope.refresh();

    $scope.openItem = function ($event, item) {
      var parentEl = angular.element(document.body);
      $mdDialog.show({
        parent: parentEl,
        targetEvent: $event,
        templateUrl: 'app/question/question.dialog/question.dialog.html',
        locals: {
          item: item
        },
        controller: 'QuestionDialogCtrl'
      }).then(function (newItem) {
        console.log('item', newItem);
        if (!item._id) {
          $http.post('/api/questions', newItem).then(function (response) {
            console.log('item created successfully');
            $scope.refresh();
          }).catch(function (err) {
            console.error('error', err);
          });
        }
        else {
          $http.patch('/api/questions/' + newItem._id, newItem).then(function (response) {
            console.log('item updated successfully');
            $scope.refresh();
          }).catch(function (err) {
            console.error('error', err);
          });
        }
      });
    }
  });
