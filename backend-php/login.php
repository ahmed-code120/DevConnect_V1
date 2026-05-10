<?php
// login.php

session_start();

// Database configuration
$db_host = 'localhost';
$db_name = 'devconnect_db';
$db_user = 'root';
$db_pass = '';

header('Content-Type: application/json');

// Establish database connection
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get POST data
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $password = isset($_POST['password']) ? trim($_POST['password']) : '';

    if (empty($email) || empty($password)) {
        echo json_encode(["status" => "error", "message" => "Please fill in all fields"]);
        exit;
    }

    try {
        // Fetch user from database
        $stmt = $pdo->prepare("SELECT id, full_name, email, password_hash FROM users WHERE email = :email LIMIT 1");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Verify password using PHP's password_verify
            if (password_verify($password, $user['password_hash'])) {
                // Password is correct, start a session
                session_regenerate_id();
                
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['full_name'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['logged_in'] = true;

                echo json_encode(["status" => "success", "message" => "Login successful", "redirect" => "/feed"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
        }
    } catch(PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Query failed"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}
?>
