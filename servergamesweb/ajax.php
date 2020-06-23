<?php

$connection;
$isLoggedIn;

function initialize() {
    global $connection, $isLoggedIn;

    sleep(1);

    if (!isset($_SESSION['getCounter'])) {
        $_SESSION['getCounter'] = 0;
    }

    if (!isset($_SESSION['isLoggedIn'])) {
        $_SESSION['isLoggedIn'] = false;
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

function tryLogin() {
    global $connection, $isLoggedIn;

    $username = $_REQUEST["username"];
    $password = $_REQUEST["password"];

    if (!$username) {
        serverError("Username is required");
    }

    $sql = 'SELECT * FROM user u
            WHERE u.isExpired IS NULL AND u.username = "' . $username . '" AND u.pWord = "' . $password .'"';

    $result = $connection->query($sql);

    if ($result !== false) {
        if ($result->num_rows > 0) {
            // Success
            $_SESSION["userData"] = json_encode($result->fetch_assoc());
            $ud = json_decode($_SESSION["userData"]);
            $_SESSION["isLoggedIn"] = true;
            $isLoggedIn = true;

            $userSql = 'UPDATE user SET isOnline=1 WHERE id=' . $ud->id ;
            $userResult = $connection->query($userSql);
            // return $_SESSION["userData"];
            return getUserInfo();
        }
        else {
            serverError('User not found or incorrect password');            
        }
    }
    else {
        serverError('Could not execute query: ' . $connection->error);
    }

}

function tryLogout() {
    global $connection;

    $ud = json_decode($_SESSION["userData"]);
    $userSql = 'UPDATE user SET isOnline=0 WHERE id=' . $ud->id ;
    $userResult = $connection->query($userSql);

    if (!$userResult) {
        serverError('Could not execute query: ' . $connection->error);
    }

    $_SESSION["userData"] = json_encode(array('username' => ''));
    $_SESSION["isLoggedIn"] = false;

    return getUserInfo();
}

function tryNewUser() {
    global $connection, $isLoggedIn;

    $username = preg_replace('/[^a-z0-9_]+/i','',$_REQUEST["username"]);
    $password = $_REQUEST["password"];

    if (!$username) {
        serverError("Username is required");
    }

    if ($username !== $_REQUEST["username"]) {
        serverError("Username must use regualar characters");
    }

    $sql = 'SELECT * FROM user u
            WHERE u.isExpired IS NULL AND u.username = "' . $username . '"';

    $result = $connection->query($sql);

    if ($result !== false) {
        if ($result->num_rows > 0) {
            serverError('User already exists');
        }
        else {
            $userSql = 'INSERT INTO user (username, pword)
                    VALUES ("' . $username . '","' . $password . '")';
            
            $userResult = $connection->query($userSql);

            if ($userResult == false) {
                serverError('Unknown reason user could not be created: ' . $connection->error);
            }

            return tryLogin();
        }
    }
    else {
        serverError('Could not execute query: ' . $connection->error);
    }
}

function getUserInfo() {
    if (isset($_SESSION['userData']) && isset($_SESSION['isLoggedIn'])) {
        $userdata = json_decode($_SESSION['userData']);
        return json_encode(array('username' => ($userdata->username), 'isLoggedIn' => $_SESSION['isLoggedIn']));
    }
    else {
        
    }
}

function serverError($message = "Internal Server Error", $code = 0) {
    header('HTTP/1.1 500 Internal Server Booboo');
    header('Content-Type: application/json; charset=UTF-8');
    die(json_encode(array('message' => $message, 'code' => $code)));            
}

if (isset($_GET["t"])) {
    $t = $_GET["t"];
    if (!session_id()) {
        session_start();
    }
    initialize();

    $isLoggedIn = $_SESSION['isLoggedIn'];

    if ($t == "homecards") {
        echo getHomeCards();
    }
    else if ($t == "games") {
        echo getActiveGames();
    }
    else if ($t == "newuser") {
        echo tryNewUser();
    }
    else if ($t == "login") {
        if (isset($_POST['username']) && isset($_POST['password'])) {
            echo tryLogin();
        }
        else {
            serverError('Invalid login credentials');            
        }
    }
    else if ($t == "logout") {
        if (isset($_SESSION['userData'])) {
            echo tryLogout();
        }
    }
    else if ($t == "userinfo") {
        if ($isLoggedIn) {
            echo getUserInfo();
        }
        else {
            echo json_encode(array('username' => ''));
        }
    }
}

?>
