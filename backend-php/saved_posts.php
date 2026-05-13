<?php
// backend-php/saved_posts.php
require_once 'config.php';

requireAuth();

$user_id = $_SESSION['user_id'];

if ($_SERVER["REQUEST_METHOD"] == "GET") {
    try {
        $stmt = $pdo->prepare("
            SELECT p.*, u.full_name as name, u.avatar, u.handle 
            FROM saved_posts sp
            JOIN posts p ON sp.post_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE sp.user_id = ?
            ORDER BY sp.created_at DESC
        ");
        $stmt->execute([$user_id]);
        $posts = $stmt->fetchAll();

        foreach ($posts as &$post) {
            $post['images'] = json_decode($post['images']);
            $post['tags'] = json_decode($post['tags']);
        }

        sendResponse("success", "Saved posts fetched", $posts);
    } catch(PDOException $e) {
        sendResponse("error", "Failed to fetch saved posts");
    }
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    $post_id = $data['post_id'] ?? null;

    if (!$post_id) {
        sendResponse("error", "Post ID is required");
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM saved_posts WHERE user_id = ? AND post_id = ?");
        $stmt->execute([$user_id, $post_id]);
        $existing = $stmt->fetch();

        if ($existing) {
            $pdo->prepare("DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?")->execute([$user_id, $post_id]);
            sendResponse("success", "Unsaved successfully", ["isSaved" => false]);
        } else {
            $pdo->prepare("INSERT INTO saved_posts (user_id, post_id) VALUES (?, ?)")->execute([$user_id, $post_id]);
            sendResponse("success", "Saved successfully", ["isSaved" => true]);
        }
    } catch(PDOException $e) {
        sendResponse("error", "Failed to toggle save: " . $e->getMessage());
    }
}
?>
