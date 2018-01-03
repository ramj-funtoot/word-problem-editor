var app = angular.module('wpappApp');
app.controller('details', function ($scope, $http, $filter) {
  $scope.content = [];
  $scope.column = "createdBy";
  $scope.status = ['Any', 'Live', "Draft", "Retired"];
  $scope.selectedStatus = "Live";
  $scope.loading = true
  $http.get("/api/questions/worksheet/jsondata").then(function (res) {
    $scope.allContent = res.data.content;
    $scope.content = res.data.content;
    $scope.version = res.data.version_date;
    var parr = '';
    if ($scope.content)
      $scope.content.forEach(function (element) {
        if (element.body && element.body.theme['plugin-manifest'].plugin && element.body.theme[
            'plugin-manifest'].plugin.length > 0) {
          parr = '';
          element.body.theme['plugin-manifest'].plugin.forEach(function (p) {
            parr = parr + p.id;
          });
          element.pluginsUsed = parr;
        }
      });
    $scope.vm = {
      items: {
        getItemAtIndex: function (index) {
          return $scope.content[index];
        },
        getLength: function () {
          return $scope.content ? $scope.content.length : 0;
        }
      }
    };
    $scope.loading = false;
    $scope.filterList()
  }).catch(function (err) {
    $scope.loading = false;
    console.log("error getting file - ", err)
  });
  $scope.getDisplayableDate = function (d, bool) {
    if (!bool)
      return moment(d).format("LL");
    else
      return moment(d).format('MMMM Do YYYY, h:mm:ss a');
  }
  $scope.filterList = function (filter) {
    $scope.content = $filter('filter')($scope.allContent, {
      name: $scope.searchWS,
      pluginsUsed: ($scope.searchP && $scope.searchP.length > 0) ? $scope.searchP : undefined,
      status: $scope.selectedStatus == "Any" ? undefined : $scope.selectedStatus
    });
  }
  $scope.getCount = function (status) {
    if (status == "Current") {
      return $scope.content.length;
    }
    var count = 0;
    if ($scope.allContent) {
      $scope.allContent.forEach(function (c) {
        if (c.status == status) {
          count++;
        }
      });
    }
    return count;
  }
})
