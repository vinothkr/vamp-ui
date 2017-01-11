/* global Environment,Help */
angular.module('app').component('info', {
  templateUrl: 'app/info/info.html',
  controller: InfoController
});

function InfoController($rootScope, $scope, $vamp) {
  var $ctrl = this;
  $scope.info = {};
  $scope.help = {
    title: '',
    description: '',
    links: []
  };

  var showI = false;
  var showH = false;

  $ctrl.showInfo = function () {
    return showI;
  };

  $ctrl.showHelp = function () {
    return showH;
  };

  this.closePanel = function () {
    $rootScope.infoPanelActive = false;
    $rootScope.helpPanelActive = false;
  };

  $rootScope.$on('$stateChangeStart',
    function (event, toState) {
      var path = toState.url.substring(1);
      var last = path.indexOf('/');
      if (last !== -1) {
        path = path.substring(0, last);
      }

      if (Help.prototype.entries()[path]) {
        $scope.help.title = path;
        $scope.help.description = Help.prototype.entries()[path].description;
        $scope.help.links = Help.prototype.entries()[path].links;
      } else {
        $scope.help.title = 'help';
        $scope.help.description = Help.prototype.entries().default.description;
        $scope.help.links = Help.prototype.entries().default.links;
      }
    }
  );

  if ($vamp.connected()) {
    $vamp.peek('/info');
  }

  $scope.$on('$vamp:connection', function (event, connection) {
    if (connection === 'opened') {
      $vamp.peek('/info');
    }
  });

  $rootScope.$watch('infoPanelActive', function (newValue) {
    $scope.infoPanelActive = newValue;
    if ($scope.infoPanelActive) {
      showI = true;
      showH = false;
    }
    if (!$scope.info.message) {
      $vamp.peek('/info');
    }
  });

  $rootScope.$watch('helpPanelActive', function (newValue) {
    $scope.helpPanelActive = newValue;
    if ($scope.helpPanelActive) {
      showH = true;
      showI = false;
    }
  });

  $scope.$on('/info', function (event, data) {
    /* eslint camelcase: ["error", {properties: "never"}] */
    data = data.data;
    if (!data.persistence || !data.pulse || !data.key_value || !data.gateway_driver || !data.container_driver || !data.workflow_driver) {
      return;
    }

    $scope.info.message = data.message;
    $scope.info.running_since = data.running_since;
    $scope.info.version = data.version;
    $scope.info.ui_version = Environment.prototype.version();
    $scope.info.persistence = data.persistence.database.type === 'key-value' ? data.key_value.type : data.persistence.database.type;
    $scope.info.pulse = data.pulse.type;
    $scope.info.key_value_store = data.key_value.type;
    $scope.info.container_driver = data.container_driver.type;

    $scope.info.gateway_driver = '';
    var types = new Set();
    for (var gateway in data.gateway_driver.marshallers) {
      if (gateway && data.gateway_driver.marshallers.hasOwnProperty(gateway)) {
        types.add(data.gateway_driver.marshallers[gateway].type);
      }
    }
    types.forEach(function (value) {
      $scope.info.gateway_driver += $scope.info.gateway_driver === '' ? value : ', ' + value;
    });

    $scope.info.workflow_driver = '';
    for (var workflow in data.workflow_driver) {
      if (workflow && data.workflow_driver.hasOwnProperty(workflow)) {
        $scope.info.workflow_driver += $scope.info.workflow_driver === '' ? workflow : ', ' + workflow;
      }
    }
  });
}
