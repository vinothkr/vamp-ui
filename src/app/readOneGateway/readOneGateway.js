/* global _*/
function readOneGatewayController(Api, $interval, $stateParams, $filter, toastr, EventStreamHandler, $uibModal, $state, DataManager) {
  var weightsModal;


  var self = this;

  self.gateway = {};

  self.responseTimeFlowingValues = {
    values: new CappedArray(360, true),
    labels: new CappedArray(360, true)
  };

  self.rateFlowingValues = {
    values: new CappedArray(360, true),
    labels: new CappedArray(360, true)
  };

  Api.read('gateways', $stateParams.id).then(resourceLoaded);

  function resourceLoaded(response) {
    // Get the data and generate the metadata
    var gateway = response.data;
    addMetaData(gateway);
    self.gateway = gateway;

    //Add stream handlers
    EventStreamHandler.getStream(newHealthStatEvent, ['gateways', 'gateways:' + gateway.name, 'health']);
    EventStreamHandler.getStream(newResponseTimeEvent, ['gateways', 'gateways:' + gateway.name, 'metrics', 'metrics:responseTime']);
    EventStreamHandler.getStream(newRateEvent, ['gateways', 'gateways:' + gateway.name, 'metrics', 'metrics:rate']);

    //Define modals
    var routeWeights = {};
    for (var routeName in self.gateway.routes) {
      routeWeights[routeName] = parseInt(self.gateway.routes[routeName].weight);
    }

    weightsModal = new Modal('editWeightsModal', routeWeightsAdjusted, {weightValues: routeWeights});
  }


  function removeMetaData(data) {
    for (var attribute in data) {
      if (typeof data[attribute] === 'object') {
        removeMetaData(data[attribute]);
      }

      if (attribute.substring(0, 2) === '_$') {
        delete data[attribute];
      }
    }

    return data;
  }

  function updateGateway(gatewayData) {
    var pureData = removeMetaData(angular.copy(gatewayData));
    console.log('pureData', pureData);

    Api.update('gateways', gatewayData.name, pureData).then(gatewayUpdated);

    function gatewayUpdated(response) {
      toastr.success('Weights of routes of gateway' + self.gateway.name + ' updated');
    }
  }

  function routeWeightsAdjusted(routeWeights) {
    // Adjust the weights in the scope
    for (var routeName in routeWeights) {
      var routeWeight = routeWeights[routeName];
      self.gateway.routes[routeName].weight = routeWeight + '%';
    }

    console.log('prefilter', self.gateway);
    updateGateway(self.gateway);
  }

  function addMetaData(gateway) {
    // get health stats
    gateway._$stats = {
      health: {
        data: new CappedArray(20),
        labels: new CappedArray(20)
      },
      responseTime: {
        data: new CappedArray(20),
        labels: new CappedArray(20)
      },
      rate: {
        data: new CappedArray(20),
        labels: new CappedArray(20)
      }
    };

    for (var routeName in gateway.routes) {
      var route = gateway.routes[routeName];

      route._$stats = {
        health: new SparklineStats(6),
        responseTime: new SparklineStats(20),
        rate: new SparklineStats(20)
      }

      function SparklineStats(size) {
        var self = this;
        self.values = new CappedArray(size);

        self.callback = function (event) {
          self.values.push(event.value);
        };
      }

      EventStreamHandler.getStream(route._$stats.health.callback, ['gateways', 'gateways:' + gateway.name, 'health', 'routes', 'routes:' + routeName]);
      EventStreamHandler.getStream(route._$stats.responseTime.callback, ['gateways', 'gateways:' + gateway.name, 'metrics', 'metrics:responseTime', 'routes', 'routes:' + routeName]);
      EventStreamHandler.getStream(route._$stats.rate.callback, ['gateways', 'gateways:' + gateway.name, 'metrics', 'metrics:rate', 'routes', 'routes:' + routeName]);
    }
  }

  function newHealthStatEvent(event) {
    self.gateway._$stats.health.data.push(event.value * 100);
    self.gateway._$stats.health.labels.push($filter('date')(event.timestamp, "mm:ss"));
  }

  function newResponseTimeEvent(event) {
    self.gateway._$stats.responseTime.data.push(event.value);
    self.gateway._$stats.responseTime.labels.push(event.timestamp);
  }

  function newRateEvent(event) {
    self.gateway._$stats.rate.data.push(event.value);
    self.gateway._$stats.rate.labels.push(event.timestamp);
  }

  // This will update the data for the repsonsetime and rate chart 25 times per second for a flowing look;
  $interval(function () {
    if (self.gateway._$stats) {
      var currentResponseTimeValue = self.gateway._$stats.responseTime.data.getLast();
      var currentRateValue = self.gateway._$stats.rate.data.getLast();

      console.log(self.responseTimeFlowingValues.values);
      self.responseTimeFlowingValues.labels.push('');
      self.responseTimeFlowingValues.values.push(currentResponseTimeValue);

      self.rateFlowingValues.values.push(currentRateValue);
      self.rateFlowingValues.labels.push('');
    }
  }, 25);

  self.openWeightsModal = function () {
    weightsModal.open();
  }

  //CONST

  self.healthChart = {};
  self.healthChart.series = ['Series A'];

  self.healthChart.colors = ['#00FF00'];
  self.healthChart.options = {
    animation: false,
    scales: {
      yAxes: [{
        display: true,
        ticks: {
          beginAtZero: true,
          max: 100,
          min: 0
        }
      }]
    }
  };

  self.chartOptions = {
    animation: {
      duration: 0
    },
    elements: {
      line: {
        borderWidth: 0.5
      },
      point: {
        radius: 0
      }
    },
    scales: {
      xAxes: [{
        display: false
      }],
      yAxes: [{
        display: true,
        ticks: {
          beginAtZero: true,
          suggestedMax: 3
        }
      }],
      gridLines: {
        display: false
      }
    }
  };

  // REST
  self.getObjectLength = function (obj) {
    var length = -1;

    if (obj) {
      length = Object.keys(obj).length;
    }

    return length;
  }

  function Modal(templateName, resultCallback, resolves) {
    var self = this;

    self.modalData = {
      animation: true,
      controller: templateName,
      templateUrl: 'app/' + templateName + '/' + templateName + '.html',
      size: 'md',
      resolve: {}
    };

    console.log(self.modalData);

    if (resolves) {
      for (var attribute in resolves) {
        self.modalData.resolve[attribute] = function () {
          return resolves[attribute];
        };
      }
    }

    self.open = function () {
      self.instance = $uibModal.open(self.modalData);
      self.instance.result.then(resultCallback);
    };
  }
}

angular
  .module('app')
  .component('readOneGateway', {
    templateUrl: 'app/readOneGateway/readOneGateway.html',
    controller: readOneGatewayController
  });

