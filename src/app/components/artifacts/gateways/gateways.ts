import {Component , provide} from 'angular2/core';

import {newApiService} from '../../../services/api/api'
import {Store} from '../../../services/store/store'

@Component({
  selector: 'vamp-gateways',
  templateUrl: 'app/components/artifacts/gateways/gateways.html',
  styleUrls: ['app/components/artifacts/gateways/gateways.css'],
  providers: [
    provide( Store , {
      useFactory: newApiService => {
        return new Store( 'gateways' , [ 'GET' , 'POST' , 'PUT' , 'DELETE' ] , newApiService );
      },
      deps: [ newApiService ]
    } )
  ],
  directives: [],
  pipes: []
})

export class Gateways {
  // Add requirements specific to Blueprints here.
  constructor( private _store : Store ) {
    this._store = _store;
  }

  get gateways() {
    return this._store.items$.getValue();
  }
}