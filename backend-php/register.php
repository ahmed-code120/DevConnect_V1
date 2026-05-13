<?php
// backend-php/register.php
require_once 'config.php';


if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get and sanitize data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    $full_name = htmlspecialchars($data['full_name'] ?? '', ENT_QUOTES, 'UTF-8');
    $email = filter_var($data['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $handle = htmlspecialchars($data['handle'] ?? '', ENT_QUOTES, 'UTF-8');
    $password = $data['password'] ?? '';

    // Basic validation
    if (empty($full_name) || empty($email) || empty($password) || empty($handle)) {
        sendResponse("error", "Please fill in all fields");
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse("error", "Invalid email format");
    }

    try {
        // Check if email or handle already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email OR handle = :handle");
        $stmt->execute([':email' => $email, ':handle' => $handle]);
        
        if ($stmt->fetch()) {
            sendResponse("error", "Email or handle already registered");
        }

        // Hash the password
        $password_hash = password_hash($password, PASSWORD_DEFAULT);

        // Insert new user without avatar and cover_image (they should be empty initially)
        $stmt = $pdo->prepare("INSERT INTO users (full_name, email, handle, password_hash, avatar, cover_image) VALUES (:name, :email, :handle, :hash, NULL, NULL)");
        
        if ($stmt->execute([':name' => $full_name, ':email' => $email, ':handle' => $handle, ':hash' => $password_hash])) {
            $user_id = $pdo->lastInsertId();
            
            // Log the user in
            $_SESSION['user_id'] = $user_id;
            $_SESSION['user_name'] = $full_name;
            $_SESSION['user_handle'] = $handle;
            $_SESSION['logged_in'] = true;
            
            sendResponse("success", "Registration successful", [
                "user" => [
                    "id" => (string)$user_id,
                    "handle" => $handle,
                    "name" => $full_name,
                    "email" => $email,
                    "avatar" => null,
                    "cover_image" => null,
                    "bio" => "",
                    "followers" => 0,
                    "following" => 0,
                    "posts" => 0
                ],
                "redirect" => "/feed"
            ]);
        } else {
            sendResponse("error", "Registration failed");
        }
    } catch(PDOException $e) {
        sendResponse("error", "Database error: " . $e->getMessage());
    }
} else {
    sendResponse("error", "Invalid request method");
}
?>
