/* BreedsController.$inject = ['$scope', 'artifactsMetadata', 'namifyFilter', '$controller'];
function BreedsController(
  $scope, artifactsMetadata, namifyFilter, $controller) {
  var $ctrl = this;
  $controller('BaseArtifactsController', {$ctrl: $ctrl, $scope: $scope, artifactsMetadata: artifactsMetadata});

  $ctrl.onDataResponse = function () {
    angular.forEach($ctrl.artifacts, function (ar) {
      ar.ports = namifyFilter(ar.ports);
    });
  };
}

angular.module('vamp-ui').controller('BreedsController', BreedsController);*/

function breedsController($scope, $state, $stateParams, artifactsMetadata, $vamp, namifyFilter) {
  var $ctrl = this;

  $ctrl.breeds = [];
  $ctrl.config = artifactsMetadata;
  var path = '/breeds';

  $ctrl.add = function () {
    $state.go('.add');
  };

  $ctrl.onView = function (breed) {
    $state.go('.one', {
      name: breed.name
    });
  };

  $ctrl.delete = function (breed) {
    $vamp.remove(path + '/' + breed.name, angular.toJson(breed));

    peek();
  };

  // $scope event listenters

  $scope.$on('$vamp:connection', function (e, connection) {
    if (connection === 'opened') {
      peek();
    }
  });

  $scope.$on(path, function (e, response) {
    angular.copy(_.orderBy(response.data, 'name'), $ctrl.breeds);

    angular.forEach($ctrl.breeds, function (ar) {
      ar.ports = namifyFilter(ar.ports);
    });
  });

  $scope.$on('/events/stream', function (e, response) {
    if (_.includes(response.data.tags, 'breeds')) {
      peek();
    }
  });

  function peek() {
    $vamp.peek(path);
  }

  peek();
}

breedsController.$inject = ['$scope', '$state', '$stateParams', 'artifactsMetadata', '$vamp', 'namifyFilter'];
angular.module('vamp-ui').controller('breedsController', breedsController);
