angular.module('starter.controllers', [])

        .controller('TimerCtrl', function ($scope, ionicTimePicker, $rootScope, $state, $timeout, $window) {
            // Timer
            construct();
            $scope.runingTimer = "TIMER";

            function construct() {
                var mytimeout = null; // the current timeoutID;
                $scope.timeSeted = false;
                $scope.timer = 0;
                $scope.done = false;
                $scope.title = "Automated Room - Timer";
            }

            $scope.swipeRight = function () {
                $state.go('tab.dash');
            };

            $scope.doRefresh = function () {
                $window.location.reload();
            }

            // actual timer method, counts down every second, stops on zero
            $scope.onTimeout = function () {
                $scope.runingTimer = $scope.humanizeDurationTimer($scope.timer - 1, 's');
                if ($scope.timer == 0) {
                    $rootScope.$broadcast("Timer", {timer: "TIMER"});
                    $scope.$broadcast('timer-stopped', 0);
                    $timeout.cancel(mytimeout);
                    return;
                }
                $scope.timer--;
                mytimeout = $timeout($scope.onTimeout, 1000);
            };

            $scope.selectTimer = function (val) {
                $scope.timeForTimer = val;
                $scope.timer = val;
                $scope.started = false;
                $scope.paused = false;
                $scope.done = false;
            };

            // functions to control the timer
            // starts the timer
            $scope.startTimer = function () {
                cordova.plugins.backgroundMode.enable();
                mytimeout = $timeout($scope.onTimeout, 1000);
                $scope.started = true;
            };

            // stops and resets the current timer
            $scope.stopTimer = function () {
                if ($scope.timer == 0) {
                    $scope.$broadcast('timer-stopped', $scope.timer);
                }
                $scope.timer = 0;
                $scope.started = false;
                $scope.paused = false;
                $rootScope.$broadcast("Timer", {timer: "TIMER"});
                $timeout.cancel(mytimeout);
                $scope.runingTimer = "TIMER";
                cordova.plugins.backgroundMode.disable();
            };

            $scope.$watch("runingTimer", function () {
                if ($scope.timer == 0) {
                    $scope.runingTimer = "TIMER";
                }
            });

            // triggered, when the timer stops, you can do something here, maybe show a visual indicator or vibrate the device
            $scope.$on('timer-stopped', function (event, remaining) {
                if (remaining === 0) {
                    $scope.timer = 0;
                    $rootScope.$emit("ChangeStatus", {});
                    $scope.done = true;
                    return;
                }
            });

            // This function helps to display the time in a correct way in the center of the timer
            $scope.humanizeDurationTimer = function (input, units) {
                // units is a string with possible values of y, M, w, d, h, m, s, ms
                if (input == 0) {
                    return 0;
                } else {
                    var duration = moment().startOf('day').add(input, units);
                    var format = "";
                    if (duration.hour() > 0) {
                        format += "H[h] ";
                    }
                    if (duration.minute() > 0) {
                        format += "m[m] ";
                    }
                    if (duration.second() > 0) {
                        format += "s[s] ";
                    }

                    return duration.format(format);
                }
            };


            /** Time Picker **/

            $scope.setTime = function () {

                var ipObj1 = {
                    callback: function (val) {      //Mandatory
                        if (typeof (val) !== 'undefined') {
                            var selectedTime = new Date(val * 1000);
                            console.log('Selected epoch is : ', val, 'and the time is ', selectedTime.getUTCHours(), 'H :', selectedTime.getUTCMinutes(), 'M');
                            var d = new Date();
                            console.log(d);

                            selectedTime.setFullYear(d.getFullYear());
                            selectedTime.setMonth(d.getMonth());
                            selectedTime.setDate(d.getDate());

                            selectedTime.setHours(selectedTime.getUTCHours());
                            selectedTime.setMinutes(selectedTime.getUTCMinutes());
                            selectedTime.setSeconds(selectedTime.getUTCSeconds());


                            if (parseInt(selectedTime.getHours()) == parseInt(d.getHours()) &&
                                    parseInt(selectedTime.getMinutes()) == parseInt(d.getMinutes())) {
                                alert("Selecione um Horário Valido");
                                $scope.runingTimer = "TIMER";
                                return;
                            }
                            if (parseInt(selectedTime.getHours()) < parseInt(d.getHours()) ||
                                    (parseInt(selectedTime.getHours()) == parseInt(d.getHours()) &&
                                            parseInt(selectedTime.getMinutes()) < parseInt(d.getMinutes()))) {
                                selectedTime.setDate(d.getDate() + 1);
                            }
                            console.log(selectedTime);
                            var timeSeconds = (selectedTime.getTime() - d.getTime()) / 1000.0;
                            $scope.selectTimer(parseInt(timeSeconds));
                            $scope.startTimer();

                        }
                    },
                    inputTime: ((new Date()).getHours() * 60 * 60 + (new Date()).getMinutes() * 60), //Optional
                    format: 24,
                    step: 1,
                    setLabel: 'OK'
                };

                ionicTimePicker.openTimePicker(ipObj1);
            }
        })

        .controller('DashCtrl', function ($scope, $rootScope, $state, $http, $window) {
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

            $scope.swipeLeft = function () {
                $state.go('tab.timer');
            };

            $scope.doRefresh = function () {
                $window.location.reload();
            }

            $rootScope.$on("ChangeStatus", function () {
                $scope.changeStatus();
            });

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