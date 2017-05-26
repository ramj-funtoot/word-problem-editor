'use strict';

angular.module('wpappApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('question', {
        url: '/',
        templateUrl: 'app/question/question.html',
        controller: 'QuestionCtrl',
        authenticate: true
      });
  });