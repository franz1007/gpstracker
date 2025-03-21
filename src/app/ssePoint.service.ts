import { Observable } from "rxjs";
import { environment } from "../environments/environment";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class SsePointService {

    constructor() { }

    createEventSource(): Observable<any> {
      return new Observable<any>(subscriber => {
        const eventSource = new EventSource(environment.apiUrl + "/api/sse");
        eventSource.onmessage = ev  => {
            console.log(ev)
            subscriber.next(ev.data)
        }
        eventSource.onerror = ev => {
            console.log(ev)
            subscriber.error(ev)
        }
        eventSource.onopen = ev => {
            console.log(ev)
        }
        return () => eventSource.close()
      })
   }
}