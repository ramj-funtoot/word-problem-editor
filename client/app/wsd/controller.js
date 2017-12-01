var app = angular.module('wpappApp');
app.controller('details', function ($scope, $http, $filter) {
  $scope.reverse = false;
  $scope.content = [];
  $scope.column = "createdBy";
  $scope.status = ['Any', 'Live', "Draft", "Retired"];
  $scope.selectedStatus = "Live";
  $scope.loading = true
  $http.get("app/wsd/worksheetDetails.json").then(function (res) {
    $scope.allContent = res.data.content;
    $scope.content = res.data.content;

    if ($scope.content)
      $scope.content.forEach(element => {
        //console.log("estate", JSON.parse(element.editorState))
        if (element.body && element.body.theme['plugin-manifest'].plugin && element.body.theme[
            'plugin-manifest'].plugin.length > 0) {
          element.pluginsUsed = JSON.stringify(element.body.theme['plugin-manifest'].plugin)
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
  });
  $scope.getList = function (parray) {
    if (parray) {
      var arr = [];
      console.log("parray", parray)
      parray.forEach(function (a) {
        //if (a.plugin.includes("funtoot"))
        arr.push(a.id)
      })
      return arr;
    }
  }
  $scope.getDisplayableDate = function (d) {
    return moment(d).format("LL");
  }
  $scope.filterList = function (filter) {
    $scope.content = $filter('filter')($scope.allContent, {
      name: $scope.searchWS,
      pluginsUsed: $scope.searchP,
      status: $scope.selectedStatus == "Any" ? undefined : $scope.selectedStatus
    });
    console.log("dd", $scope.content.length)
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
