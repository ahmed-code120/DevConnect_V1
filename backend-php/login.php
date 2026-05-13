<?php
// backend-php/login.php
require_once 'config.php';


if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get POST data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    $email = isset($data['email']) ? trim($data['email']) : '';
    $password = isset($data['password']) ? trim($data['password']) : '';

    if (empty($email) || empty($password)) {
        sendResponse("error", "Please fill in all fields");
    }

    try {
        // Fetch user from database
        $stmt = $pdo->prepare("SELECT id, full_name, email, password_hash, handle, avatar, cover_image, bio, followers_count, following_count, posts_count FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password_hash'])) {
            // Password is correct, start a session
            session_regenerate_id();
            
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['full_name'];
            $_SESSION['user_handle'] = $user['handle'];
            $_SESSION['logged_in'] = true;

            // Map fields to what frontend expects
            $userData = [
                'id' => (string)$user['id'],
                'handle' => $user['handle'],
                'name' => $user['full_name'],
                'email' => $user['email'],
                'avatar' => $user['avatar'],
                'cover_image' => $user['cover_image'],
                'bio' => $user['bio'] ?: '',
                'followers' => (int)$user['followers_count'],
                'following' => (int)$user['following_count'],
                'posts' => (int)$user['posts_count']
            ];
            sendResponse("success", "Login successful", [
                "user" => $userData,
                "redirect" => "/feed"
            ]);
        } else {
            sendResponse("error", "Invalid email or password");
        }
    } catch(PDOException $e) {
        sendResponse("error", "Query failed: " . $e->getMessage());
    }
} else {
    sendResponse("error", "Invalid request method");
}
?>
