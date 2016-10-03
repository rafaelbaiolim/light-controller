angular.module('starter', ['ionic', 'starter.controllers',
    'ionic-timepicker', 'angular-svg-round-progressbar'])

        .run(function ($ionicPlatform) {
            $ionicPlatform.ready(function () {
                if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                    cordova.plugins.Keyboard.disableScroll(true);

                }
                if (window.StatusBar) {
                    StatusBar.backgroundColorByHexString("#272822");
                }
            });
        })

        .config(function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                    // setup an abstract state for the tabs directive
                    .state('tab', {
                        url: '/tab',
                        abstract: true,
                        templateUrl: 'templates/tabs.html',
                    })
                    .state('tab.timer', {
                        url: '/timer',
                        abstract: false,
                        views: {
                            'tab-timer': {
                                templateUrl: 'templates/tab-timer.html',
                            }
                        }
                    })

                    // Each tab has its own nav history stack:
                    .state('tab.dash', {
                        url: '/dash',
                        views: {
                            'tab-dash': {
                                templateUrl: 'templates/tab-dash.html',
                            }
                        }
                    })


            // if none of the above states are matched, use this as the fallback
            $urlRouterProvider.otherwise('/tab/dash');

        });
