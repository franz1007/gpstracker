import {
  ChronoUnit,
  DateTimeFormatter,
  Duration,
  Instant,
  ZoneId,
} from '@js-joda/core';
export class TrackNoPoints {
  uuid: string;
  startTimestamp: Instant;
  endTimestamp: Instant;
  category: string;
  group?: TrackGroup;
  constructor(
    uuid: string,
    startTimestamp: Instant,
    endTimestamp: Instant,
    category: string,
    group?: TrackGroup,
  ) {
    this.uuid = uuid;
    this.startTimestamp = startTimestamp;
    this.endTimestamp = endTimestamp;
    this.category = category;
    this.group = group;
  }
}

export class TrackGroup {
  uuid: string;
  name: string;
  constructor(uuid: string, name: string) {
    this.uuid = uuid;
    this.name = name;
  }
}
export class TrackMetadata {
  uuid: string;
  startTimestamp: Instant;
  endTimestamp: Instant;
  duration: Duration;
  durationString: string;
  distanceMeters?: number;
  category: string;
  averageSpeedKph?: number;
  startTimestampString: string;
  group?: TrackGroup;
  constructor(
    uuid: string,
    startTimestamp: Instant,
    endTimestamp: Instant,
    category: string,
    distanceMeters?: number,
    averageSpeedKph?: number,
    group?: TrackGroup,
  ) {
    this.uuid = uuid;
    this.startTimestamp = startTimestamp;
    this.startTimestampString =
      startTimestamp
        .atZone(ZoneId.SYSTEM)
        .format(DateTimeFormatter.ofPattern('yyyy-MM-dd HH:mm')) + ' Uhr';
    this.endTimestamp = endTimestamp;
    this.distanceMeters = distanceMeters;
    this.averageSpeedKph = averageSpeedKph;
    this.category = category;
    this.duration = Duration.between(startTimestamp, endTimestamp);
    this.duration.toHours();
    const hours = this.duration.toHours();
    const minutes = this.duration.minusHours(hours).toMinutes();
    this.durationString =
      hours + ':' + minutes.toString().padStart(2, '0') + ' h';
    console.log(startTimestamp.toString());
    console.log(this.startTimestampString);
    this.group = group;
  }
}

export class SegmentMetadata {
  duration: Duration;
  distance: number;
  constructor(duration: Duration, distance: number) {
    this.duration = duration;
    this.distance = distance;
  }
}

export class PointMetadata {
  timestamp: Instant;
  distance: number;
  speed: number;
  constructor(timestamp: Instant, distance: number, speed: number) {
    this.timestamp = timestamp;
    this.distance = distance;
    this.speed = speed;
  }
}
