<?php
require_once 'config.php';

echo "<h1>DevConnect Connection Test</h1>";

// Check PHP Version
echo "PHP Version: " . phpversion() . "<br>";

// Check Database Connection
try {
    $stmt = $pdo->query("SELECT 1");
    echo "<b style='color: green;'>Database connection successful!</b><br>";
} catch (PDOException $e) {
    echo "<b style='color: red;'>Database connection failed:</b> " . $e->getMessage() . "<br>";
}

// Check Directory
echo "Current Directory: " . __DIR__ . "<br>";

// Instructions
echo "<h2>Next Steps:</h2>";
echo "<p>If everything is green above, your backend is working. Make sure your <b>vite.config.ts</b> target matches this URL.</p>";
echo "<p>Example: If this page is at <code>http://localhost/devconnect/backend-php/test_connection.php</code>, then your target should be <code>http://localhost/devconnect/backend-php</code></p>";
?>
