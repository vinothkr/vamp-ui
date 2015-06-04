var React = require('react/addons');
var DeploymentListItem = require('./DeploymentListItem.jsx');
var ToolBar = require('../ToolBar.jsx');
var LoadStates = require("../../constants/LoadStates.js");
var classNames = require('classnames');
var TransitionGroup = React.addons.CSSTransitionGroup;

var DeploymentsList = React.createClass({
  getInitialState: function() {
    return {
      filterText: '',
      viewType:'general-list'
    };
  },
  
  handleAdd: function() {
    console.log('handle add')
  },
  handleUserInput: function(filterText) {
    this.setState({
      filterText: filterText,
    });
  },
  handleViewSwitch: function(viewType) {
    this.setState({
      viewType: viewType,
    });
  },

  render: function() {

      var allDeployments = this.props.allDeployments;
      var deployments = [];

      var loadingClassSet = classNames({
        "hidden": this.props.loadState !== LoadStates.STATE_LOADING
      });


      for (var key in allDeployments) {
        deployments.push(<DeploymentListItem key={key} deployment={allDeployments[key]} />);
      }

      var emptyClassSet = classNames({
        "empty-list": true,
        "hidden": deployments.length > 0
      });
      var listHeaderClasses = classNames({
        "list-header": true,
        "hidden": deployments.length <= 0
      });


    return(
      <div className='list-container'>
        <ToolBar 
          filterText={this.state.filterText}
          onUserInput={this.handleUserInput}
          handleViewSwitch={this.handleViewSwitch} />
        <span className={emptyClassSet}>No running deployments.</span>
        <TransitionGroup id='deployments-list' component="ul" transitionName="fadeIn" transitionAppear={true} className={this.state.viewType}>
          <li className={listHeaderClasses}>
            <div className="list-section section-half">
              <h4>Deployment</h4>
            </div>
            <div className="list-section section-sixth">
              <h4>Clusters</h4>
            </div>
            <div className="list-section section-sixth">
              <h4>Services</h4>
            </div>
            <div className="list-section section-sixth">
            </div>
          </li>
          {deployments}
        </TransitionGroup>
      </div>
  )}
});
 
module.exports = DeploymentsList;