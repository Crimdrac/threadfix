var myAppModule = angular.module('threadfix')

myAppModule.controller('ApplicationPageModalController', function($scope, $rootScope, $window, $log, $http, $modal) {

    $scope.csrfToken = $scope.$parent.csrfToken;

    $scope.currentModal = null;

    // initialize objects for forms
    $scope.$watch('csrfToken', function() {
       $http.get($window.location.pathname + "/objects" + $scope.csrfToken).
           success(function(data, status, headers, config) {

               if (data.success) {
                   $scope.config = data.object;
                   if (!$scope.config.wafList) {
                       $scope.config.wafList = [];
                   }
                   $scope.config.application.organization = $scope.config.application.team;
               } else {
                   $log.info("HTTP request for form objects failed. Error was " + data.message);
               }
           }).
           error(function(data, status, headers, config) {
                $log.info("HTTP request for form objects failed.");
               // TODO improve error handling and pass something back to the users
               $scope.errorMessage = "Request to server failed. Got " + status + " response code.";
           });
    });

    // Handle the complex modal interactions on the edit application modal
    $scope.$on('modalSwitch', function(event, name) {
        if (name === 'addWaf') {
            $scope.currentModal.dismiss('modalChanged');
            if (!$scope.config.wafList) {
                $scope.config.wafList = [];
            }
            if ($scope.config.wafList.length === 0) {
                $scope.showCreateWafModal();
            } else {
                $scope.showAddWafModal();
            }
        } else if (name === 'createWaf') {
            $scope.currentModal.dismiss('modalChanged');
            $scope.showCreateWafModal();
        }
    });

    $scope.showEditModal = function() {

        var modalInstance = $modal.open({
            templateUrl: 'editApplicationModal.html',
            controller: 'ModalControllerWithConfig',
            resolve: {
                url: function() {
                    var app = $scope.config.application;
                    return "/organizations/" + app.team.id + "/applications/" + app.id + "/edit" + $scope.csrfToken;
                },
                object: function () {
                    var app = $scope.config.application;
                    app.deleteUrl = "/organizations/" + app.team.id + "/applications/" + app.id + "/delete" + $scope.csrfToken
                    return $scope.config.application;
                },
                config: function() {
                    return $scope.config;
                },
                buttonText: function() {
                    return "Save Changes";
                }
            }
        });

        $scope.currentModal = modalInstance;

        modalInstance.result.then(function (application) {
            $scope.config.application = application;
            $scope.successMessage = "Successfully edited application " + application.name;
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };

    $scope.showAddWafModal = function() {
        var modalInstance = $modal.open({
            templateUrl: 'addWafModal.html',
            controller: 'ModalControllerWithConfig',
            resolve: {
                url: function() {
                    var app = $scope.config.application;
                    return "/organizations/" + app.team.id + "/applications/" + app.id + "/edit/wafAjax" + $scope.csrfToken;
                },
                object: function () {
                    return {
                        waf: {
                            id: $scope.config.application.waf.id
                        }
                    };
                },
                config: function() {
                    return $scope.config;
                },
                buttonText: function() {
                    return "Add WAF";
                }
            }
        });

        $scope.currentModal = modalInstance;

        modalInstance.result.then(function (waf) {
            $scope.config.application.waf = waf;
            $scope.successMessage = "Set waf to " + waf.name;
            $scope.showEditModal();
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    }

    $scope.showCreateWafModal = function() {
        var modalInstance = $modal.open({
            templateUrl: 'createWafModal.html',
            controller: 'ModalControllerWithConfig',
            resolve: {
                url: function() {
                    return "/wafs/new/ajax/appPage" + $scope.csrfToken;
                },
                object: function () {
                    return {
                        wafType: {
                            id: 1
                        },
                        applicationId: $scope.config.application.id
                    };
                },
                config: function() {
                    return $scope.config;
                },
                buttonText: function() {
                    return "Create WAF";
                }
            }
        });

        $scope.currentModal = modalInstance;

        modalInstance.result.then(function (waf) {
            $scope.config.wafs.push(waf);
            $scope.config.application.waf = waf;
            $scope.successMessage = "Successfully created waf " + waf.name;
            $scope.showEditModal();
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    }

    // Handle fileDragged event and upload scan button clicks
    $scope.$on('fileDragged', function(event, $files) {
        $scope.showUploadForm($files);
    });

    $scope.showUploadForm = function(files) {
        var modalInstance = $modal.open({
            templateUrl: 'uploadScanForm.html',
            controller: 'UploadScanController',
            resolve: {
                url: function() {
                    var app = $scope.config.application;
                    return "/organizations/" + app.team.id + "/applications/" + app.id + "/upload/remote" + $scope.csrfToken;
                },
                files: function() {
                    return files;
                }
            }
        });

        modalInstance.result.then(function (scan) {
            $log.info("Successfully uploaded scan.");
            $rootScope.$broadcast('scanUploaded');
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });

    }

})