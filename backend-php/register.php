<?php
// register.php

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
    // Get and sanitize POST data
    $full_name = filter_input(INPUT_POST, 'full_name', FILTER_SANITIZE_STRING);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'] ?? '';

    // Basic validation
    if (empty($full_name) || empty($email) || empty($password)) {
        echo json_encode(["status" => "error", "message" => "Please fill in all fields"]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["status" => "error", "message" => "Invalid email format"]);
        exit;
    }

    try {
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(["status" => "error", "message" => "Email already registered"]);
            exit;
        }

        // Hash the password using PHP's password_hash
        $password_hash = password_hash($password, PASSWORD_DEFAULT);

        // Insert new user
        $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, created_at) VALUES (:name, :email, :hash, NOW())");
        $stmt->bindParam(':name', $full_name);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':hash', $password_hash);
        
        if ($stmt->execute()) {
            
            // Log the user in immediately after registration
            $_SESSION['user_id'] = $pdo->lastInsertId();
            $_SESSION['user_name'] = $full_name;
            $_SESSION['user_email'] = $email;
            $_SESSION['logged_in'] = true;
            
            echo json_encode(["status" => "success", "message" => "Registration successful", "redirect" => "/feed"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Registration failed"]);
        }
    } catch(PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}
?>
