<?php
// backend-php/upload.php
require_once 'config.php';
requireAuth();

$user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $type = $_POST['type'] ?? 'avatar'; // 'avatar' or 'cover'
    
    if (!isset($_FILES['image'])) {
        sendResponse("error", "No image uploaded");
    }

    $file = $_FILES['image'];
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = $type . "_" . $user_id . "_" . time() . "." . $ext;
    $target = "uploads/" . $filename;

    if (move_uploaded_file($file['tmp_name'], $target)) {
        // Public URL for the frontend
        $url = "/api/php/" . $target;
        
        try {
            if ($type === 'avatar') {
                $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
            } else {
                $stmt = $pdo->prepare("UPDATE users SET cover_image = ? WHERE id = ?");
            }
            $stmt->execute([$url, $user_id]);
            
            sendResponse("success", "Image uploaded successfully", ["url" => $url]);
        } catch (PDOException $e) {
            sendResponse("error", "Database update failed");
        }
    } else {
        sendResponse("error", "Failed to move uploaded file");
    }
} else {
    sendResponse("error", "Invalid request method");
}
?>
