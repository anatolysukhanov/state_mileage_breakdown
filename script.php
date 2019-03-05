<?php

class DB
{
    function __construct()
    {
        $this->conn = @pg_connect("host=localhost dbname=database user=user password=password");
    }

    function calculateMileageByState($path)
    {
        if ($this->conn) {

            $lines = [];

            for ($i = 0; $i < count($path); $i++) {
                $lines[] = "ST_LineFromEncodedPolyline('" . $path[$i] . "')";
            }

            $multiLine = join(",", $lines);

            $result = pg_query($this->conn, "SELECT name, SUM(mileage) FROM (
                    SELECT step_id, name, (ROW_NUMBER () OVER (ORDER BY step_id) - ROW_NUMBER () OVER (PARTITION by name ORDER BY step_id)) state_route, mileage FROM (
                        SELECT ROW_NUMBER () OVER () step_id, name, mileage FROM (
                            WITH route AS (
                                SELECT linestring, ROW_NUMBER () OVER () route_id
                                FROM unnest(ARRAY[$multiLine]) linestring
                            ) SELECT name, ST_Length(ST_Intersection(linestring, wkb_geometry)::geography) * 0.621371 mileage FROM route 
                            INNER JOIN states ON ST_Intersects(linestring, wkb_geometry) 
                            ORDER BY route_id, ST_StartPoint(linestring) <-> wkb_geometry
                        ) a
                    ) b
                ) c GROUP BY state_route, name ORDER BY MAX(step_id)");

            $mileageByState = [];

            while ($s = pg_fetch_row($result)) {
                $mileageByState[] = array(
                    "state" => $s[0],
                    "mileage" => $s[1]
                );
            }

            return json_encode(array("mileage" => $mileageByState));

        } else {

            return json_encode(array("error" => "no database connection"));
        }
    }
}

try {
    $db = new DB();
    $path = json_decode($_POST['route']);
    echo $db->calculateMileageByState($path);
} catch (Exception $e) {
    return json_encode(array("error" => "Internal error"));
}