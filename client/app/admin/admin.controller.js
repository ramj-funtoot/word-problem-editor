'use strict';

angular.module('wpappApp')
  .controller('AdminCtrl', function ($scope, $http, Auth, User, $mdDialog) {

    // Use the User $resource to fetch all users
    $scope.users = User.query();

    $scope.delete = function (user) {
      User.remove({ id: user._id });
      angular.forEach($scope.users, function (u, i) {
        if (u === user) {
          $scope.users.splice(i, 1);
        }
      });
    }

    $scope.getUserImage = function (user) {
      if (user.provider && user[user.provider] && user[user.provider].image)
        return user[user.provider].image.url;
      else return '/assets/images/default-user-icon-profile.png';
    }

    $scope.addUser = function ($event) {
      // Appending dialog to document.body to cover sidenav in docs app
      var confirm = $mdDialog.prompt()
        .title('Add new user')
        .textContent('Enter the Google email address of the user.')
        .placeholder('email address')
        .ariaLabel('Email address')
        .initialValue('')
        .targetEvent($event)
        .ok('Add')
        .cancel('Cancel');
      $mdDialog.show(confirm).then(function (result) {
        var newUser = new User();
        newUser.name = newUser.email = newUser.password = result;
        User.save(newUser, function () {
          console.log('User ' + result + ' created');
        }, function (err) {
          console.error(err);
        });
      }, function () {
      });
    };
  });
