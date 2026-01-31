ALTER TABLE gpspoints ADD "location" GEOGRAPHY(PointZ, 4326);

UPDATE gpspoints gp
SET "location" = ST_SetSRID(
    ST_MakePoint(
        pos.lon,       -- X (longitude)
        pos.lat,       -- Y (latitude)
        gp.altitude    -- Z (altitude)
    ),
    4326
)::geography
FROM gpspositions pos
WHERE gp.position_id = pos.id;

ALTER TABLE gpspoints
ALTER COLUMN "location" SET NOT NULL;

ALTER TABLE gpspoints
DROP CONSTRAINT fk_gpspoints_position_id__id;

ALTER TABLE gpspoints
DROP COLUMN position_id;

ALTER TABLE gpspoints
DROP COLUMN altitude;

DROP TABLE gpspositions;