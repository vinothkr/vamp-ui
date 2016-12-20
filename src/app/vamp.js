/* global Environment */
/* eslint camelcase: ["error", {properties: "never"}] */
'use strict';
angular.module('app')
  .factory('$vamp', ['$log', '$rootScope', '$websocket', '$timeout', function ($log, $rootScope, $websocket, $timeout) {
    return new Vamp($log, $rootScope, $websocket, $timeout);
  }])
  .run(['$vamp', function ($vamp) {
    $vamp.init();
  }]);

function Vamp($log, $rootScope, $websocket, $timeout) {
  var stream;
  var transaction = 1;

  var notify = function (name, value) {
    $log.debug('websocket notify: ' + name + ' :: ' + JSON.stringify(value));
    $rootScope.$broadcast(name, value);
  };

  var awaiting = [];

  var process = function (message) {
    $log.debug('websocket message: ' + message);
    var response = JSON.parse(message);

    if (response.content === 'JSON' && response.data) {
      try {
        response.data = JSON.parse(response.data);
      } catch (e) {
      }
    }

    if (awaiting[response.transaction]) {
      if (response.status === 'ERROR') {
        awaiting[response.transaction].reject(response);
      } else {
        awaiting[response.transaction].resolve(response);
      }

      delete awaiting[response.transaction];
    }

    notify(response.path, response);
  };

  this.connected = function () {
    return !_.isEmpty(stream);
  };

  this.peek = function (path, data, params, accept) {
    request(path, 'PEEK', data, params ? params : {}, accept ? accept : 'JSON');
  };

  this.put = function (path, data, params, accept) {
    request(path, 'PUT', data, params ? params : {}, accept ? accept : 'JSON');
  };

  this.remove = function (path, data, params, accept) {
    request(path, 'REMOVE', data, params ? params : {}, accept ? accept : 'JSON');
  };

  this.await = function (request) {
    var current = transaction;
    awaiting[current] = {};

    var promise = new Promise(function (resolve, reject) {
      awaiting[current].reject = reject;
      awaiting[current].resolve = resolve;
      $timeout(function () {
        if (awaiting[current]) {
          awaiting[current].reject();
        }
      }, 5000);
      request();
    });

    awaiting[current].promise = promise;

    return promise;
  };

  this.init = function () {
    var url;
    if (Environment.prototype.origin()) {
      url = 'ws://' + Environment.prototype.origin() + '/websocket';
    } else {
      url = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      url += window.location.host;
      url += window.location.pathname.endsWith('/') ? window.location.pathname + 'websocket' : window.location.pathname + '/websocket';
    }

    var websocket = function () {
      $log.debug('websocket: ' + url);
      stream = $websocket(url);

      stream.onOpen(function () {
        $log.debug('websocket is opened');
        notify('$vamp:connection', 'opened');
      });

      stream.onClose(function () {
        $log.info('websocket closed, will try to reconnect in 5 seconds...');
        notify('$vamp:connection', 'closed');
        stream = null;
        $timeout(websocket, 10000);
      });

      stream.onMessage(function (message) {
        process(message.data);
      });
    };

    websocket();
  };

  function request(path, action, data, params, accept) {
    if (!stream) {
      return null;
    }
    var message = {
      api: 'v1',
      path: path,
      action: action,
      accept: accept,
      content: 'JSON',
      transaction: String(transaction++),
      data: data,
      parameters: params
    };

    $log.debug('websocket send: ' + JSON.stringify(message));
    stream.send(message);
  }
}
