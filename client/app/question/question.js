'use strict';

angular.module('wpappApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('question', {
        url: '/',
        templateUrl: 'app/question/question.html',
        controller: 'QuestionCtrl',
        authenticate: true
      })
      .state('wsdetails', {
        url: '/wsd',
        templateUrl: 'app/wsd/showWorksheetData.html',
        controller: 'details',
        authenticate: true
      })
  });
