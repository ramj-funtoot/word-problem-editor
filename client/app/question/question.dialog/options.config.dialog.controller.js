'use strict';

angular.module('wpappApp')
  .controller('OptionsConfigDialogCtrl', function ($scope, dD, i18n, qtype, $mdConstant, $mdDialog) {
   
    $scope.dD = dD;
    $scope.i18n = i18n;
    $scope.qtype = qtype;
    $scope.langId = 'en';
    
    $scope.closeDialog = function () {
      $mdDialog.cancel();
    };
    
    $scope.save = function ($event) {
      $mdDialog.hide($scope.step);
    }

    //parameters required, dropDown Identifier
    $scope.addNewOptionForDropDown = function ($event, dropDownId) {
            $scope.dD.options.push({
                text:"OPT_" + dropDownId + "_" + dD.options.length,
                answer:false,
                mh:"MH_" + dropDownId + "_" + dD.options.length,
                mmc:[],
                image:null,
            })
      }

      $scope.deleteOptionFromDropDown = function ($event, dropDownId, optionIndex) {

        var confirm = $mdDialog.confirm()
                .title('Confirm Delete Option')
                .textContent('Are you sure you want to delete this option?')
                .ariaLabel('Delete Option')
                .targetEvent($event)
                .ok('Yes')
                .cancel('No')
                .multiple(true);
            $mdDialog.show(confirm).then(function () {
                //Remove particular option
                delete $scope.i18n['en'][$scope.dD.options[optionIndex].mh]
                delete $scope.i18n['en'][$scope.dD.options[optionIndex].text]
                $scope.dD.options.splice(optionIndex, 1);

                _.each($scope.dD.options, function(option, i){
                  if(i >= optionIndex){
                    var mhVal = $scope.i18n['en'][option.mh];
                    var textVal = $scope.i18n['en'][option.text]
                    delete $scope.i18n['en'][option.mh];
                    delete $scope.i18n['en'][option.text];
                    option.mh = "MH_"  + dropDownId + "_" + i;
                    option.text = "OPT_"  + dropDownId + "_" + i;
                    $scope.i18n['en'][option.mh] = mhVal;
                    $scope.i18n['en'][option.text] = textVal;
                  }
                })
               
            }, function () {});      
    }


      $scope.save = function ($event) {
        $mdDialog.hide($scope.dD);
      }

  });
