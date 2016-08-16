angular
  .module('app')
  .config(pluginsConfig);

function pluginsConfig(toastrConfig) {
  // Configuration of the angular-toastr plugin. See: https://github.com/Foxandxss/angular-toastr
  angular.extend(toastrConfig, {
    autoDismiss: false,
    timeOut: 0,
    extendedTimeOut: 0,
    allowHtml: false,
    closeButton: true,
    tapToDismiss: false,
    positionClass: 'toast-top-right',
    preventOpenDuplicates: true
  });
}
angular
  .module('app')
  .run(function(editableOptions) {
    editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
  });
