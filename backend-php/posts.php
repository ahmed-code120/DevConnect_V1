<?php
// backend-php/posts.php
require_once 'config.php';

if ($_SERVER["REQUEST_METHOD"] == "GET") {
    $user_id = $_SESSION['user_id'] ?? null;
    session_write_close();
    try {
        $filter = $_GET['filter'] ?? 'latest';

        $query = "
            SELECT p.*, u.full_name as name, u.avatar, u.handle ";
        
        if ($user_id) {
            $query .= ", (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = :user_id) > 0 as isLiked,
                         (SELECT COUNT(*) FROM saved_posts WHERE post_id = p.id AND user_id = :user_id) > 0 as isSaved,
                         (SELECT COUNT(*) FROM follows WHERE follower_id = :user_id AND following_id = p.user_id) > 0 as is_following ";
        } else {
            $query .= ", FALSE as isLiked, FALSE as isSaved, FALSE as is_following ";
        }

        $query .= "FROM posts p 
            JOIN users u ON p.user_id = u.id ";
            
        if ($filter === 'following' && $user_id) {
            $query .= "JOIN follows f ON p.user_id = f.following_id AND f.follower_id = :user_id ";
        }

        $query .= "ORDER BY p.created_at DESC";

        $stmt = $pdo->prepare($query);
        if ($user_id) {
            $stmt->execute([':user_id' => $user_id]);
        } else {
            $stmt->execute();
        }
        $posts = $stmt->fetchAll();

        // Format JSON fields
        foreach ($posts as &$post) {
            $post['images'] = json_decode($post['images']);
            $post['tags'] = json_decode($post['tags']);
            $post['isLiked'] = (bool)$post['isLiked'];
            $post['isSaved'] = (bool)$post['isSaved'];
            $post['is_following'] = (bool)$post['is_following'];
        }

        sendResponse("success", "Posts fetched successfully", $posts);
    } catch(PDOException $e) {
        sendResponse("error", "Failed to fetch posts: " . $e->getMessage());
    }
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    requireAuth();

    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    $user_id = $_SESSION['user_id'];
    $desc = $data['desc'] ?? '';
    $images = json_encode($data['images'] ?? []);
    $video_url = $data['video_url'] ?? null;
    $repository = $data['repository'] ?? null;
    $live_demo = $data['live_demo'] ?? null;
    $tags = json_encode($data['tags'] ?? []);

    if (empty($desc)) {
        sendResponse("error", "Description is required");
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO posts (user_id, `desc`, images, video_url, repository, live_demo, tags) 
            VALUES (:user_id, :desc, :images, :video_url, :repo, :demo, :tags)
        ");
        
        $params = [
            ':user_id' => $user_id,
            ':desc' => $desc,
            ':images' => $images,
            ':video_url' => $video_url,
            ':repo' => $repository,
            ':demo' => $live_demo,
            ':tags' => $tags
        ];

        if ($stmt->execute($params)) {
            $post_id = $pdo->lastInsertId();
            
            // Increment user post count
            $pdo->prepare("UPDATE users SET posts_count = posts_count + 1 WHERE id = ?")->execute([$user_id]);

            sendResponse("success", "Post created successfully", ["id" => $post_id]);
        } else {
            sendResponse("error", "Failed to create post");
        }
    } catch(PDOException $e) {
        sendResponse("error", "Database error: " . $e->getMessage());
    }
}
?>
