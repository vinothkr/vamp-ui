function NavbarService() {
  this.getNavbarItems = getNavbarItems;

  var navbarItems = [
    {
      text: 'Blueprints',
      goToState: 'readAllBlueprints'
    },
    {
      text: 'Deployments',
      goToState: 'deployments'
    },
    {
      text: 'Gateways',
      goToState: 'gateways'
    }
  ];

  function getNavbarItems() {
    return navbarItems;
  }
}

angular
  .module('app')
  .service('NavbarService', NavbarService);
