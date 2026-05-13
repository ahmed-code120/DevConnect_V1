<?php
// backend-php/projects.php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user_id = $_GET['user_id'] ?? null;
    
    if (!$user_id && isset($_SESSION['user_id'])) {
        $user_id = $_SESSION['user_id'];
    }

    if (!$user_id) {
        sendResponse("error", "User ID is required.");
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user_id]);
        $projects = $stmt->fetchAll();

        foreach ($projects as &$project) {
            $project['tags'] = json_decode($project['tags']);
        }

        sendResponse("success", "Projects fetched successfully.", $projects);
    } catch (PDOException $e) {
        sendResponse("error", "Database error: " . $e->getMessage());
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth();
    $user_id = $_SESSION['user_id'];
    $input = json_decode(file_get_contents('php://input'), true);

    $title = $input['title'] ?? null;
    $description = $input['description'] ?? null;
    $github_url = $input['github_url'] ?? null;
    $live_demo_url = $input['live_demo_url'] ?? null;
    $image_url = $input['image'] ?? null;
    $tags = isset($input['tags']) ? json_encode($input['tags']) : json_encode([]);

    if (!$title) {
        sendResponse("error", "Title is required.");
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO projects (user_id, title, description, github_url, live_demo_url, image_url, tags) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, $title, $description, $github_url, $live_demo_url, $image_url, $tags]);
        
        $project_id = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ?");
        $stmt->execute([$project_id]);
        $project = $stmt->fetch();
        $project['tags'] = json_decode($project['tags']);

        sendResponse("success", "Project added successfully.", $project);
    } catch (PDOException $e) {
        sendResponse("error", "Database error: " . $e->getMessage());
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireAuth();
    $user_id = $_SESSION['user_id'];
    $project_id = $_GET['id'] ?? null;

    if (!$project_id) {
        sendResponse("error", "Project ID is required.");
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$project_id, $user_id]);

        if ($stmt->rowCount() > 0) {
            sendResponse("success", "Project deleted successfully.");
        } else {
            sendResponse("error", "Project not found or unauthorized.");
        }
    } catch (PDOException $e) {
        sendResponse("error", "Database error: " . $e->getMessage());
    }
}
?>
