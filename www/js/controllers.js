angular.module('starter.controllers', [])

        .controller('DashCtrl', function ($scope, $http, $window) {
            var apiURL;
            $scope.resetESP = true;
            $scope.cantConnect = false;
            $scope.canChangeStatus = false;
            $scope.releStatus = "HIGH";

            var currentStatus = 0;
            constructor();
            //currentLightState 
            function constructor() {
                apiURL = "http://192.168.25.202";
                //apiURL = "http://localhost:1337/192.168.25.202";
                checkStatus();
            }

            $scope.changeStatus = function () {

                if (currentStatus == 0) {
                    apiURL += "/H";
                } else {
                    apiURL += "/L";
                }

                $http({
                    method: 'GET',
                    url: apiURL,
                    headers: {
                        'Content-type': 'application/json'
                    }
                }).then(function successCallback(response) {
                    checkStatus();
                }, function errorCallback(response) {
                    $scope.cantConnect = true;
                });
                apiURL = "http://192.168.25.202";
            }

            function checkStatus() {
                $http({
                    method: 'GET',
                    url: apiURL,
                    headers: {
                        'Content-type': 'application/json'
                    }
                }).then(function successCallback(response) {
                    $scope.canChangeStatus = true;
                    $scope.resetESP = false;
                    currentStatus = response.data[0].currentLightState;
                    $scope.releStatus = "HIGH";
                    if (currentStatus == 0) {
                        $scope.releStatus = "LOW";
                    }
                }, function errorCallback(response) {
                    $scope.cantConnect = true;
                });
            }
        });