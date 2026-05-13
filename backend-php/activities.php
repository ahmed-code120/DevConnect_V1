<?php
// backend-php/activities.php
require_once 'config.php';

requireAuth();

$user_id = $_SESSION['user_id'];

if ($_SERVER["REQUEST_METHOD"] == "GET") {
    try {
        $stmt = $pdo->prepare("
            SELECT a.*, u.full_name as actor_name, u.avatar as actor_avatar, u.handle as actor_handle
            FROM activities a
            JOIN users u ON a.actor_id = u.id
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$user_id]);
        $activities = $stmt->fetchAll();

        sendResponse("success", "Activities fetched", $activities);
    } catch(PDOException $e) {
        sendResponse("error", "Failed to fetch activities");
    }
}

// Mark as read
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        $pdo->prepare("UPDATE activities SET is_read = TRUE WHERE user_id = ?")->execute([$user_id]);
        sendResponse("success", "Activities marked as read");
    } catch(PDOException $e) {
        sendResponse("error", "Failed to update activities");
    }
}
?>
