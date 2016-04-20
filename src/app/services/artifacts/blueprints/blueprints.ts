import {Component , Inject , Injectable , provide} from 'angular2/core';

import {newApiService} from '../../../services/api/api';
import {newEventStream} from '../../../services/event-stream/event-stream';
import {NotificationStore} from '../../../services/store/notifications';
import {Store} from '../../../services/store/store';

// @Component({
//   selector: 'vamp-blueprints',
//   templateUrl: 'app/components/artifacts/_partials/list.html',
//   styleUrls: ['app/components/artifacts/blueprints/blueprints.css'],
//   providers: [
//     newApiService,
//     provide( Store , {
//       useFactory: newApiService => {
//         return new Store( 'blueprints' , newApiService , [ 'GET' , 'POST' , 'PUT' , 'DELETE' ] );
//       },
//       deps: [ newApiService , newEventStream ]
//     } )
//   ],
//   directives: [],
//   pipes: []
// })

@Injectable()
export class Blueprints extends Store {
  // Add requirements specific to Blueprints here.
  constructor(
    @Inject( newApiService ) _api,
    @Inject( newEventStream ) private _events,
    @Inject( NotificationStore ) private _notifier
  ) {
    super( 'blueprints' , _api , [ 'GET' , 'POST' , 'PUT' , 'DELETE' ] );

    // this._events.listen( 'event' , [this._artifact,'archive:create'] , data => {
    //   this.load();
    // } )

    this._events.listen( 'event' , ['deployments','synchronization:deployed'] , data => {
      this._notifier.addNotification( { message: data.value['_1'].name + ' is deployed' , type: 'info' } );
    } )
  }

  get blueprints() {
    return this.items;
  }

  // Deploy method calls the api to create a deployment from the corresponding
  // blueprint.
  // TODO: Use the generated Deploymentstore to add the blueprint as deployment
  // instead of injecting the API service here.
  deploy( item ) {
    return this._api.put( 'deployments' , item.name , item )
      .subscribe();
  }

  // This could add a cluster by providing a name and a JSON object.
  addCluster( name:string , data:Object ) {}
}
