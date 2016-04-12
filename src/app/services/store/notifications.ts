import { Injectable } from 'angular2/core';
import { BehaviorSubject } from 'rxjs/Rx';

import { Store } from './store';

export interface Notification {
  message : string,
  type    : string
}

@Injectable()
export class NotificationStore extends Store {

  public items$ : BehaviorSubject<Array<Notification>> = new BehaviorSubject([]);
  public timeoutDuration : number = 6000;

  constructor() {
    super( 'notifications' );
  }

  addNotification( notification : Notification ) {
    this.add( notification );

    setTimeout( () => this.delete( notification ) , this.timeoutDuration );
  }

}
