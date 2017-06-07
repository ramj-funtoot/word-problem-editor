'use strict';

angular.module('wpappApp')
  .controller('QuestionCtrl', function ($scope, $http, $mdDialog, Auth, User) {
    $scope.showMyItems = true;

    $scope.refresh = function (my) {
      $scope.showMyItems = my;
      if ($scope.showMyItems) {
        var user = Auth.getCurrentUser();
        $http.get('/api/questions/' + user.email).then(function (response) {
          $scope.items = response.data;
        }).catch(function (error) {
          $scope.message = "No items to show!";
        });
      }
      else {
        $http.get('/api/questions').then(function (response) {
          $scope.items = response.data;
        }).catch(function (error) {
          $scope.message = "No items to show!";
        });
      }
    }

    $scope.refresh($scope.showMyItems);

    $scope.openItem = function ($event, item) {
      var parentEl = angular.element(document.body);
      $mdDialog.show({
        parent: parentEl,
        targetEvent: $event,
        templateUrl: 'app/question/question.dialog/question.dialog.html',
        locals: {
          item: item,
          users: $scope.users
        },
        multiple: true,
        controller: 'QuestionDialogCtrl'
      }).then(function (newItem) {
        console.log('item', newItem);
        if (!newItem._id) {
          $http.post('/api/questions', newItem).then(function (response) {
            console.log('item created successfully');
            $scope.refresh($scope.showMyItems);
          }).catch(function (err) {
            console.error('error', err);
          });
        }
        else {
          $http.patch('/api/questions/' + newItem._id, newItem).then(function (response) {
            console.log('item updated successfully');
            $scope.refresh($scope.showMyItems);
          }).catch(function (err) {
            console.error('error', err);
          });
        }
      });
    }

    $scope.copyItem = function ($event, item) {
      var itemCopy = angular.copy(item);
      itemCopy.identifier = itemCopy._id = null;
      $scope.openItem($event, itemCopy);
    }

    $scope.archiveItem = function ($event, item) {
      var confirm = $mdDialog.confirm()
        .title('Confirm Archive')
        .textContent('Are you sure you want to archive question ' + item.identifier + '?')
        .ariaLabel('Archive Item')
        .targetEvent($event)
        .ok('Yes')
        .cancel('No')
        .multiple(true);
      $mdDialog.show(confirm).then(function () {
        item.active = !1;
        $http.patch('/api/questions/' + item._id, item).then(function (response) {
          console.log('item archived successfully');
          $scope.refresh();
        }).catch(function (err) {
          console.error('error', err);
        });
      }, function () {
      });
    }

    $scope.publishItem = function ($event, item) {
      $http.put('/api/questions/' + item._id, item).then(function (response) {
        console.log('item', response.data);
        $scope.refresh();
      }).catch(function (err) {
        console.error('error', err);
      });
    }
    $scope.getDisplayableTime = function (time) {
      return moment(time).fromNow();
    }

    $scope.selectedItems = [];

    $scope.isSelected = function (item) {
      return $scope.selectedItems.indexOf(item.identifier) > -1;
    }

    $scope.toggleSelection = function (item) {
      var idx = $scope.selectedItems.indexOf(item.identifier);
      if (idx > -1) {
        $scope.selectedItems.splice(idx, 1);
      }
      else {
        $scope.selectedItems.push(item.identifier);
      }
    }
    $scope.users = [];
    var init = function () {
      //User.getAll()
      $http.get('/api/users/').then(function (response) {
        $scope.users = response.data;
      }).catch(function (error) {
        console.log('Failed when getting users. Error: ' + error)
      });
    }();
  });