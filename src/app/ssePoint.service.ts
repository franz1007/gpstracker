import { Observable } from "rxjs";
import { environment } from "../environments/environment";
import { Injectable } from "@angular/core";
import { GpsPoint } from "./map/gps-point";

@Injectable({
    providedIn: 'root'
})
export class SsePointService {

    constructor() { }

    createEventSource(): Observable<GpsPoint> {
      return new Observable<GpsPoint>(subscriber => {
        const eventSource = new EventSource(environment.apiUrl + "/api/sse");
        eventSource.onmessage = ev  => {
            console.log(ev)
            subscriber.next(GpsPoint.fromJson(ev.data))
        }
        eventSource.onerror = ev => {
            // subscriber.error would lead to not retrying
            console.log(ev)
        }
        eventSource.onopen = ev => {
            console.log(ev)
        }
        return () => eventSource.close()
      })
   }
}