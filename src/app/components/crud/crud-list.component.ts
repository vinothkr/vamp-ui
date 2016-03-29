import {Component, OnInit} from 'angular2/core';
import {RouteParams, Router} from 'angular2/router';
import {RouterOutlet, ROUTER_DIRECTIVES} from 'angular2/router';
import {Pipe, PipeTransform} from 'angular2/core';

import {ApiService} from '../../services/api/api';
import {Editor} from '../../components/editor/editor';

/*
Pipe keys and values for an Array
*/
@Pipe({name: 'keyValues'})
export class KeyValuesPipe implements PipeTransform {
  transform(value, args:string[]) : any {
    let keys = [];
    for (let key in value) {
      keys.push({key: key, value: value[key]});
    }
    return keys;
  }
}

@Component({
  templateUrl: 'app/components/crud/crud-list.component.html',
  styleUrls: ['app/components/crud/crud-list.component.css'],
  directives: [RouterOutlet, ROUTER_DIRECTIVES, Editor],
  pipes: [KeyValuesPipe],
  providers: [ApiService],
})
export class CrudListComponent implements OnInit {

  public _items = [];
  selectedItem: Object;
  public resource:string = '';

  constructor(
    private _routeParams: RouteParams,
    private _store: ApiService
  ) {

  }

  ngOnInit() {
    this.resource = this._routeParams.get('resource') || 'deployments';
    this._store.items$.subscribe(updatedItems => this._items = updatedItems);
    this._store.getAll(this.resource);
  }

  onSelect(item: Object) { console.log('Selected', item); this.selectedItem = item; }

}