<?php
// backend-php/users.php
require_once 'config.php';
requireAuth();

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['search'])) {
    $search = $_GET['search'];
    $current_user_id = $_SESSION['user_id'];
    try {
        $stmt = $pdo->prepare("
            SELECT u.id, u.handle, u.full_name, u.avatar, 
            (SELECT COUNT(*) FROM follows WHERE follower_id = :me AND following_id = u.id) > 0 as is_following
            FROM users u 
            WHERE (u.handle LIKE :term OR u.email LIKE :term OR u.full_name LIKE :term) 
            AND u.id != :me 
            LIMIT 10
        ");
        $term = "%$search%";
        $stmt->execute([':term' => $term, ':me' => $current_user_id]);
        $users = $stmt->fetchAll();
        foreach ($users as &$user) { $user['is_following'] = (bool)$user['is_following']; }
        sendResponse("success", "Users found", $users);
    } catch (PDOException $e) {
        sendResponse("error", "Search failed: " . $e->getMessage());
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
    $current_user_id = $_SESSION['user_id'] ?? 0;
    try {
        $stmt = $pdo->prepare("
            SELECT u.id, u.handle, u.full_name, u.avatar, u.cover_image, u.bio, u.location, u.website_url, u.github_url, u.twitter_url, u.linkedin_url,
            u.followers_count as followers, u.following_count as following, u.posts_count as posts,
            (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) > 0 as is_following
            FROM users u WHERE u.id = ?
        ");
        $stmt->execute([$current_user_id, $_GET['id']]);
        $user = $stmt->fetch();
        if ($user) {
            $user['is_following'] = (bool)$user['is_following'];
            sendResponse("success", "User found", $user);
        } else {
            sendResponse("error", "User not found");
        }
    } catch (PDOException $e) {
        sendResponse("error", "Query failed: " . $e->getMessage());
    }
} else {
    sendResponse("error", "Invalid request");
}
?>
