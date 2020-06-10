<?php

$connection;
$isLoggedIn = true;

function initialize() {
    global $connection;

    $servername = "localhost";
    $username = "root";
    $password = "";
    
    try {
        // Create connection
        $connection = new mysqli($servername, $username, $password, 'servergames');
        
        // Check connection
        if ($connection->connect_error) {
            return ;
        }
    }
    catch (any $e) {
        return ;
    }
    
    return ;
}

function getHomeCards() {
    return '[ { "text": "Welcome to Games.IO!" } ]';
}

function getActiveGames() {
    global $connection, $isLoggedIn;
    $resultArray = array();

    if ($isLoggedIn) {
        $sql = "SELECT * FROM games";
        $result = $connection->query($sql);

        if ($result !== false && $result->num_rows > 0) {
            while($eachRow = $result->fetch_assoc()) {
                array_push($resultArray, $eachRow);
            }
        }
    }

    // return str_replace( '"', "'", json_encode( $resultArray ));
    return json_encode( $resultArray );
}

$t = $_REQUEST["t"];
if ($t) {
    initialize();
    if ($t == "games") {
        echo getActiveGames();
    }
    if ($t == "homecards") {
        echo getHomeCards();
    }
}
?>
