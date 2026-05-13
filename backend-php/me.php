<?php
// backend-php/me.php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    sendResponse("error", "Not logged in");
}

$userId = $_SESSION['user_id'];
session_write_close();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $full_name = $input['name'] ?? null;
    $bio = $input['bio'] ?? null;
    $handle = $input['handle'] ?? null;
    $avatar = $input['avatar'] ?? null;
    $cover_image = $input['cover_image'] ?? null;
    $location = $input['location'] ?? null;
    $website_url = $input['website'] ?? null;
    $github_url = $input['githubUsername'] ?? null;
    $twitter_url = $input['twitter_url'] ?? null;
    $linkedin_url = $input['linkedin_url'] ?? null;

    if (!$full_name || !$handle) {
        sendResponse("error", "Name and handle are required.");
    }

    try {
        $stmt = $pdo->prepare("UPDATE users SET 
            full_name = ?, bio = ?, handle = ?, avatar = ?, cover_image = ?, 
            location = ?, website_url = ?, github_url = ?, twitter_url = ?, linkedin_url = ? 
            WHERE id = ?");
        $stmt->execute([
            $full_name, $bio, $handle, $avatar, $cover_image, 
            $location, $website_url, $github_url, $twitter_url, $linkedin_url, 
            $userId
        ]);
        
        // Fetch updated user
        $stmt = $pdo->prepare("SELECT id, handle, full_name as name, email, avatar, cover_image, bio, location, website_url as website, github_url as githubUsername, twitter_url, linkedin_url, followers_count as followers, following_count as following, posts_count as posts, created_at as joined FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        sendResponse("success", "Profile updated successfully.", $user);
    } catch (PDOException $e) {
        sendResponse("error", "Database error: " . $e->getMessage());
    }
} else {
    // GET request
    try {
        $stmt = $pdo->prepare("SELECT id, handle, full_name as name, email, avatar, cover_image, bio, location, website_url as website, github_url as githubUsername, twitter_url, linkedin_url, followers_count as followers, following_count as following, posts_count as posts, created_at as joined FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if ($user) {
            sendResponse("success", "User data retrieved.", $user);
        } else {
            sendResponse("error", "User not found.");
        }
    } catch (PDOException $e) {
        sendResponse("error", "Database error: " . $e->getMessage());
    }
}
?>
