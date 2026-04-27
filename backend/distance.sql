WITH distances AS (
    SELECT
        g.*,
        ST_Distance(
                g.location,
                LAG(g.location) OVER (PARTITION BY track_id ORDER BY "timestamp")
        ) AS segment_distance
    FROM gpspoints g
    WHERE g.track_id = $1
)
SELECT
    *,
    SUM(segment_distance) OVER (PARTITION BY track_id ORDER BY "timestamp") AS cumulative_distance
FROM distances
ORDER BY "timestamp";
#Works
SELECT
    *,
    SUM(subquery.segment_distance) OVER (PARTITION BY track_id ORDER BY "timestamp") AS cumulative_distance
FROM (SELECT
          g.*,
          ST_Distance(
                  g.location,
                  LAG(g.location) OVER (PARTITION BY track_id ORDER BY "timestamp")
          ) AS segment_distance
      FROM gpspoints g) as subquery
where track_id = 1
ORDER BY "timestamp";
#works
SELECT
    subquery.track_id, subquery.timestamp,
    SUM(subquery.segment_distance) OVER (PARTITION BY track_id ORDER BY "timestamp") AS cumulative_distance
FROM (SELECT
          g.track_id,
          g.timestamp,
          ST_Distance(
                  g.location,
                  LAG(g.location) OVER (PARTITION BY track_id ORDER BY "timestamp")
          ) AS segment_distance
      FROM gpspoints g) as subquery
where track_id = 1
ORDER BY "timestamp";

##
SELECT
    subquery.track_id, subquery.timestamp,
    subquery.segment_distance)
FROM (SELECT
          g.track_id,
          g.timestamp,
          ST_Distance(
                  g.location,
                  LAG(g.location) OVER (PARTITION BY track_id ORDER BY "timestamp")
          ) AS segment_distance
      FROM gpspoints g) as subquery
where track_id = 1
ORDER BY "timestamp";
##

SELECT subquery.track_id,
       subquery.segmentDistance
FROM (SELECT
          gpspoints."timestamp",
          gpspoints.track_id,
          ST_Distance(
                  gpspoints."location",
                  LAG(gpspoints."location", 1, gpspoints."location") OVER(PARTITION BY gpspoints.track_id ORDER BY gpspoints."timestamp" DESC)
          ) segmentDistance
      FROM gpspoints) subquery
WHERE gpspoints.track_id = 1
