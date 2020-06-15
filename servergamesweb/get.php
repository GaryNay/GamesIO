<?php

$connection;
$isLoggedIn;

function getHomeCards() {
    return '[ { "text": "Welcome to Games.IO!" }, { "text": "This is old news! (got ' . $_SESSION['getCounter']++ . ' times)" } ]';
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

function initialize() {
    global $connection, $isLoggedIn;

    if (!$_SESSION['getCounter']) {
        $_SESSION['getCounter'] = 0;
    }

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

$t = $_REQUEST["t"];
if ($t) {
    if (!session_id()) {
        session_start();
    }
    initialize();

    $isLoggedIn = $_SESSION['isLoggedIn'];

    if ($t == "homecards") {
        echo getHomeCards();
    }

    if ($isLoggedIn) {
        if ($t == "games") {
            echo getActiveGames();
        }
    }
}
?>
