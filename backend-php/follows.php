<?php
// backend-php/follows.php
require_once 'config.php';
requireAuth();

$current_user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $following_id = $input['following_id'] ?? null;

    if (!$following_id || $following_id == $current_user_id) {
        sendResponse("error", "Invalid user ID");
    }

    try {
        // Check if already following
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = ?");
        $stmt->execute([$current_user_id, $following_id]);
        $is_following = $stmt->fetchColumn() > 0;

        if ($is_following) {
            // Unfollow
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?");
            $stmt->execute([$current_user_id, $following_id]);

            // Update counts
            $pdo->prepare("UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = ?")->execute([$current_user_id]);
            $pdo->prepare("UPDATE users SET followers_count = GREATEST(0, followers_count - 1) WHERE id = ?")->execute([$following_id]);

            $pdo->commit();
            
            // Get updated counts
            $stmt = $pdo->prepare("SELECT following_count FROM users WHERE id = ?");
            $stmt->execute([$current_user_id]);
            $my_following = $stmt->fetchColumn();

            $stmt = $pdo->prepare("SELECT followers_count FROM users WHERE id = ?");
            $stmt->execute([$following_id]);
            $target_followers = $stmt->fetchColumn();

            sendResponse("success", "Unfollowed successfully", [
                "is_following" => false, 
                "my_following" => $my_following, 
                "target_followers" => $target_followers
            ]);
        } else {
            // Follow
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)");
            $stmt->execute([$current_user_id, $following_id]);

            // Update counts
            $pdo->prepare("UPDATE users SET following_count = following_count + 1 WHERE id = ?")->execute([$current_user_id]);
            $pdo->prepare("UPDATE users SET followers_count = followers_count + 1 WHERE id = ?")->execute([$following_id]);

            // Create activity
            $stmt = $pdo->prepare("INSERT INTO activities (user_id, actor_id, type) VALUES (?, ?, 'follow')");
            $stmt->execute([$following_id, $current_user_id]);

            $pdo->commit();

            // Get updated counts
            $stmt = $pdo->prepare("SELECT following_count FROM users WHERE id = ?");
            $stmt->execute([$current_user_id]);
            $my_following = $stmt->fetchColumn();

            $stmt = $pdo->prepare("SELECT followers_count FROM users WHERE id = ?");
            $stmt->execute([$following_id]);
            $target_followers = $stmt->fetchColumn();

            sendResponse("success", "Followed successfully", [
                "is_following" => true,
                "my_following" => $my_following,
                "target_followers" => $target_followers
            ]);
        }
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        sendResponse("error", "Database error: " . $e->getMessage());
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user_id = $_GET['user_id'] ?? $current_user_id;
    $type = $_GET['type'] ?? 'following'; // 'following' or 'followers'

    try {
        if ($type === 'following') {
            $stmt = $pdo->prepare("
                SELECT u.id, u.handle, u.full_name, u.avatar, 
                (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) > 0 as is_following
                FROM users u
                JOIN follows f ON u.id = f.following_id
                WHERE f.follower_id = ?
            ");
            $stmt->execute([$current_user_id, $user_id]);
        } else {
            $stmt = $pdo->prepare("
                SELECT u.id, u.handle, u.full_name, u.avatar, 
                (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) > 0 as is_following
                FROM users u
                JOIN follows f ON u.id = f.follower_id
                WHERE f.following_id = ?
            ");
            $stmt->execute([$current_user_id, $user_id]);
        }
        $users = $stmt->fetchAll();
        foreach ($users as &$user) { $user['is_following'] = (bool)$user['is_following']; }
        sendResponse("success", "Users fetched", $users);
    } catch (PDOException $e) {
        sendResponse("error", "Database error");
    }
}
?>
