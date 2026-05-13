<?php
// backend-php/likes.php
require_once 'config.php';

requireAuth();

$post_id = $_GET['post_id'] ?? null;
$user_id = $_SESSION['user_id'];

if (!$post_id) {
    sendResponse("error", "Post ID is required");
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        $pdo->beginTransaction();

        // Check if already liked
        $stmt = $pdo->prepare("SELECT * FROM likes WHERE user_id = ? AND post_id = ?");
        $stmt->execute([$user_id, $post_id]);
        $existing = $stmt->fetch();

        if ($existing) {
            // Unlike
            $pdo->prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?")->execute([$user_id, $post_id]);
            $pdo->prepare("UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?")->execute([$post_id]);
            $pdo->commit();
            sendResponse("success", "Unliked successfully", ["isLiked" => false]);
        } else {
            // Like
            $pdo->prepare("INSERT INTO likes (user_id, post_id) VALUES (?, ?)")->execute([$user_id, $post_id]);
            $pdo->prepare("UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?")->execute([$post_id]);
            
            // Create activity (unless it's own post)
            $stmt = $pdo->prepare("SELECT user_id FROM posts WHERE id = ?");
            $stmt->execute([$post_id]);
            $post_owner = $stmt->fetchColumn();
            
            if ($post_owner && $post_owner != $user_id) {
                $stmt = $pdo->prepare("INSERT INTO activities (user_id, actor_id, post_id, `type`) VALUES (?, ?, ?, 'like')");
                $stmt->execute([$post_owner, $user_id, $post_id]);
            }

            $pdo->commit();
            sendResponse("success", "Liked successfully", ["isLiked" => true]);
        }
    } catch(PDOException $e) {
        $pdo->rollBack();
        sendResponse("error", "Failed to toggle like: " . $e->getMessage());
    }
}
?>
