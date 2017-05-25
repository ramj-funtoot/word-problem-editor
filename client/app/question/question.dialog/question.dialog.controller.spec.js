'use strict';

describe('Controller: QuestionDialogCtrl', function () {

  // load the controller's module
  beforeEach(module('wpappApp'));

  var QuestionDialogCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    QuestionDialogCtrl = $controller('QuestionDialogCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
