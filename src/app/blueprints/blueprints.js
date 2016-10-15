angular.module('app')
  .controller('BlueprintsController', BlueprintsController)
  .controller('DeployBlueprintController', DeployBlueprintController)
  .controller('UpdateDeploymentController', UpdateDeploymentController)
  .factory('blueprint', ['$rootScope', '$vamp', function ($rootScope, $vamp) {
    return new BlueprintService($rootScope, $vamp);
  }]);

/** @ngInject */
function BlueprintsController($scope, $location, $uibModal, toastr, $vamp, blueprint) {
  var $ctrl = this;
  this.blueprint = $scope.$parent.$parent.artifact;

  this.mergeWith = [];
  this.removeFrom = [];

  function peekDeployments() {
    blueprint.mergeWithDeployments($ctrl.mergeWith, $ctrl.blueprint);
    blueprint.removeFromDeployments($ctrl.removeFrom, $ctrl.blueprint);
  }

  peekDeployments();

  $scope.$on('deployments', function () {
    peekDeployments();
  });

  this.deploy = function ($event) {
    $event.stopPropagation();

    $uibModal.open({
      animation: true,
      controller: 'DeployBlueprintController',
      templateUrl: 'app/blueprints/deployBlueprint.html',
      resolve: {
        blueprint: function () {
          return $ctrl.blueprint;
        }
      }
    }).result.then(function (data) {
      var deployment = data.name;
      $vamp.await(function () {
        $vamp.put('/deployments/' + deployment, angular.toJson($ctrl.blueprint));
      }).then(function () {
        gotoDeployment(deployment);
        toastr.success('\'' + $ctrl.blueprint.name + '\' has been successfully deployed as \'' + deployment + '\'.');
      }).catch(function (response) {
        if (response) {
          toastr.error(response.data.message, 'Deployment of \'' + $ctrl.blueprint.name + '\' failed.');
        } else {
          toastr.error('Server timeout.', 'Deployment of \'' + $ctrl.blueprint.name + '\' failed.');
        }
      });
    });
  };

  this.merge = function ($event) {
    $event.stopPropagation();

    var modal = updateDeployment(
      $ctrl.mergeWith,
      'Merge blueprint to deployment',
      'Which deployment should \'' + $ctrl.blueprint.name + '\' be merged to?',
      'Merge',
      ''
    );

    modal.result.then(function (data) {
      var name = data.deployment.name;
      $vamp.await(function () {
        $vamp.put('/deployments/' + name, angular.toJson($ctrl.blueprint));
      }).then(function () {
        gotoDeployment(name);
        toastr.success('\'' + $ctrl.blueprint.name + '\' has been successfully merged to \'' + name + '\'.');
      }).catch(function (response) {
        if (response) {
          toastr.error(response.data.message, 'Merge of \'' + $ctrl.blueprint.name + '\' failed.');
        } else {
          toastr.error('Server timeout.', 'Merge of \'' + $ctrl.blueprint.name + '\' failed.');
        }
      });
    });
  };

  this.remove = function ($event) {
    $event.stopPropagation();

    var modal = updateDeployment(
      $ctrl.removeFrom,
      'Remove from deployment',
      'Which deployment should \'' + $ctrl.blueprint.name + '\' be removed from?',
      'Remove',
      'red'
    );

    modal.result.then(function (data) {
      var name = data.deployment.name;
      $vamp.await(function () {
        $vamp.remove('/deployments/' + name, angular.toJson($ctrl.blueprint));
      }).then(function () {
        gotoDeployment(name);
        toastr.success('\'' + $ctrl.blueprint.name + '\' has been successfully removed from \'' + name + '\'.');
      }).catch(function (response) {
        if (response) {
          toastr.error(response.data.message, 'Removal of \'' + $ctrl.blueprint.name + '\' failed.');
        } else {
          toastr.error('Server timeout.', 'Removal of \'' + $ctrl.blueprint.name + '\' failed.');
        }
      });
    });
  };

  function gotoDeployment(name) {
    $location.path('deployments/view/' + name);
  }

  function updateDeployment(deployments, title, text, buttonText, buttonClass) {
    return $uibModal.open({
      animation: true,
      controller: 'UpdateDeploymentController',
      templateUrl: 'app/blueprints/updateDeployment.html',
      resolve: {
        blueprint: function () {
          return $ctrl.blueprint;
        },
        deployments: function () {
          return deployments;
        },
        title: function () {
          return title;
        },
        text: function () {
          return text;
        },
        buttonText: function () {
          return buttonText;
        },
        buttonClass: function () {
          return buttonClass;
        }
      }
    });
  }
}

/** @ngInject */
function DeployBlueprintController($scope, $uibModalInstance, blueprint) {
  $scope.blueprint = blueprint;
  $scope.name = angular.copy(blueprint.name);

  $scope.ok = function () {
    $uibModalInstance.close({name: $scope.name});
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
}

/** @ngInject */
function UpdateDeploymentController($scope, $uibModalInstance, blueprint, deployments, title, text, buttonText, buttonClass) {
  $scope.blueprint = blueprint;
  $scope.title = title;
  $scope.text = text;
  $scope.buttonText = buttonText;
  $scope.buttonClass = buttonClass;
  $scope.deployments = deployments;
  $scope.chosenDeployment = deployments[0];

  $scope.deploymentChosen = function (deployment) {
    $scope.chosenDeployment = deployment;
  };

  $scope.ok = function () {
    $uibModalInstance.close({deployment: $scope.chosenDeployment});
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
}

function BlueprintService($rootScope, $vamp) {
  var deployments = [];

  var peek = _.throttle(function () {
    $vamp.peek('/deployments');
  }, 1000, {
    leading: true,
    trailing: false
  });

  peek();

  $rootScope.$on('/deployments', function (e, response) {
    if (response.status === 'OK') {
      deployments = _.sortBy(response.data, ['name']);
      $rootScope.$broadcast('deployments');
    }
  });

  this.mergeWithDeployments = function (list) {
    list.length = 0;

    _.forEach(_.sortBy(deployments, ['name']), function (deployment) {
      list.unshift(deployment);
    });
  };

  this.removeFromDeployments = function (list, blueprint) {
    list.length = 0;

    var filtered = _.filter(deployments, function (deployment) {
      return _.find(blueprint.clusters, function (bc, name) {
        var dc = deployment.clusters[name];
        if (_.isEmpty(dc)) {
          return false;
        }
        return _.find(bc.services, function (bs) {
          return _.find(dc.services, function (ds) {
            return bs.breed.name === ds.breed.name;
          });
        });
      });
    });

    _.forEach(_.sortBy(filtered, ['name']), function (deployment) {
      list.unshift(deployment);
    });
  };

  $rootScope.$on('/events/stream', function (e, response) {
    if ((_.includes(response.data.tags, 'deployments') && _.includes(response.data.tags, 'archive')) || _.includes(response.data.tags, 'synchronization')) {
      peek();
    }
  });
}
