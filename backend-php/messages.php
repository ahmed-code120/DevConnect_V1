<?php
// backend-php/messages.php
require_once 'config.php';
requireAuth();

$user_id = $_SESSION['user_id'];

// Get list of conversations
if ($_SERVER["REQUEST_METHOD"] == "GET" && !isset($_GET['with_user'])) {
    $tab = $_GET['tab'] ?? 'primary'; // 'primary', 'general', 'request'
    try {
        $stmt = $pdo->prepare("
            SELECT 
                u.id, u.full_name as name, u.avatar, u.handle,
                c.status, c.last_message_at as time,
                (SELECT text FROM messages WHERE (sender_id = :u AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = :u) ORDER BY created_at DESC LIMIT 1) as lastMessage,
                (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = :u AND is_read = FALSE) as unread
            FROM conversations c
            JOIN users u ON (c.user1_id = u.id AND c.user2_id = :u) OR (c.user2_id = u.id AND c.user1_id = :u)
            WHERE (c.user1_id = :u OR c.user2_id = :u) AND c.status = :tab
            ORDER BY c.last_message_at DESC
        ");
        $stmt->execute([':u' => $user_id, ':tab' => $tab]);
        $conversations = $stmt->fetchAll();

        sendResponse("success", "Conversations fetched", $conversations);
    } catch(PDOException $e) {
        sendResponse("error", "Failed to fetch conversations: " . $e->getMessage());
    }
}

// Get messages with a specific user
if ($_SERVER["REQUEST_METHOD"] == "GET" && isset($_GET['with_user'])) {
    $with_user = $_GET['with_user'];
    try {
        // Mark as read
        $pdo->prepare("UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?")->execute([$with_user, $user_id]);

        $stmt = $pdo->prepare("
            SELECT * FROM messages 
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC
        ");
        $stmt->execute([$user_id, $with_user, $with_user, $user_id]);
        $messages = $stmt->fetchAll();

        sendResponse("success", "Messages fetched", $messages);
    } catch(PDOException $e) {
        sendResponse("error", "Failed to fetch messages");
    }
}

// Send message
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    $receiver_id = $data['receiver_id'] ?? null;
    $text = $data['text'] ?? '';

    if (!$receiver_id || empty($text)) {
        sendResponse("error", "Receiver ID and text are required");
    }

    try {
        // Start transaction
        $pdo->beginTransaction();

        // Ensure conversation exists
        $u1 = min($user_id, $receiver_id);
        $u2 = max($user_id, $receiver_id);
        
        $stmt = $pdo->prepare("SELECT id, status FROM conversations WHERE user1_id = ? AND user2_id = ?");
        $stmt->execute([$u1, $u2]);
        $conv = $stmt->fetch();

        if (!$conv) {
            // New conversation - default to 'request'
            $stmt = $pdo->prepare("INSERT INTO conversations (user1_id, user2_id, status) VALUES (?, ?, 'request')");
            $stmt->execute([$u1, $u2]);
        }

        // Insert message
        $stmt = $pdo->prepare("INSERT INTO messages (sender_id, receiver_id, `text`) VALUES (?, ?, ?)");
        $stmt->execute([$user_id, $receiver_id, $text]);
        
        // Update last_message_at
        $stmt = $pdo->prepare("UPDATE conversations SET last_message_at = NOW() WHERE user1_id = ? AND user2_id = ?");
        $stmt->execute([$u1, $u2]);

        // Activity for new message
        $stmt = $pdo->prepare("INSERT INTO activities (user_id, actor_id, `type`, content) VALUES (?, ?, 'message', ?)");
        $stmt->execute([$receiver_id, $user_id, "sent you a message"]);

        $pdo->commit();
        sendResponse("success", "Message sent");
    } catch(PDOException $e) {
        $pdo->rollBack();
        sendResponse("error", "Failed to send message: " . $e->getMessage());
    }
}

// Update conversation status (Accept/Move)
if ($_SERVER["REQUEST_METHOD"] == "PUT") {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    $target_user_id = $data['user_id'] ?? null;
    $new_status = $data['status'] ?? 'primary';

    if (!$target_user_id) sendResponse("error", "User ID required");

    try {
        $u1 = min($user_id, $target_user_id);
        $u2 = max($user_id, $target_user_id);
        $stmt = $pdo->prepare("UPDATE conversations SET status = ? WHERE user1_id = ? AND user2_id = ?");
        $stmt->execute([$new_status, $u1, $u2]);
        sendResponse("success", "Conversation updated");
    } catch(PDOException $e) {
        sendResponse("error", "Update failed");
    }
}

// Delete conversation
if ($_SERVER["REQUEST_METHOD"] == "DELETE") {
    $target_user_id = $_GET['user_id'] ?? null;
    if (!$target_user_id) sendResponse("error", "User ID required");

    try {
        $u1 = min($user_id, $target_user_id);
        $u2 = max($user_id, $target_user_id);
        
        // Delete messages first (or let CASCADE handle it if FOREIGN KEY is set)
        $pdo->prepare("DELETE FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)")->execute([$user_id, $target_user_id, $target_user_id, $user_id]);
        
        // Delete conversation
        $pdo->prepare("DELETE FROM conversations WHERE user1_id = ? AND user2_id = ?")->execute([$u1, $u2]);
        
        sendResponse("success", "Conversation deleted");
    } catch(PDOException $e) {
        sendResponse("error", "Delete failed: " . $e->getMessage());
    }
}
?>
