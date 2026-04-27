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