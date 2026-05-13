<?php
// backend-php/comments.php
require_once 'config.php';

$post_id = $_GET['post_id'] ?? null;

if (!$post_id) {
    sendResponse("error", "Post ID is required");
}

if ($_SERVER["REQUEST_METHOD"] == "GET") {
    try {
        $stmt = $pdo->prepare("
            SELECT c.*, u.full_name as name, u.avatar, u.handle 
            FROM comments c 
            JOIN users u ON c.user_id = u.id 
            WHERE c.post_id = ? 
            ORDER BY c.created_at ASC
        ");
        $stmt->execute([$post_id]);
        $comments = $stmt->fetchAll();

        sendResponse("success", "Comments fetched", $comments);
    } catch(PDOException $e) {
        sendResponse("error", "Failed to fetch comments");
    }
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    requireAuth();

    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    $user_id = $_SESSION['user_id'];
    $text = $data['text'] ?? '';

    if (empty($text)) {
        sendResponse("error", "Comment text is required");
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO comments (post_id, user_id, `text`) VALUES (?, ?, ?)");
        $stmt->execute([$post_id, $user_id, $text]);

        $pdo->prepare("UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?")->execute([$post_id]);

        // Create activity (unless it's own post)
        $stmt = $pdo->prepare("SELECT user_id FROM posts WHERE id = ?");
        $stmt->execute([$post_id]);
        $post_owner = $stmt->fetchColumn();
        
        if ($post_owner && $post_owner != $user_id) {
            $stmt = $pdo->prepare("INSERT INTO activities (user_id, actor_id, post_id, `type`, content) VALUES (?, ?, ?, 'comment', ?)");
            $stmt->execute([$post_owner, $user_id, $post_id, $text]);
        }

        $pdo->commit();
        sendResponse("success", "Comment added");
    } catch(PDOException $e) {
        $pdo->rollBack();
        sendResponse("error", "Failed to add comment");
    }
}
?>
