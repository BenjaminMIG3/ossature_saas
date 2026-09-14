<?php
declare(strict_types=1);

/**
 * Émet un jeton HMAC daté pour le formulaire de démo.
 */

header("Content-Type: application/json; charset=utf-8");
header("X-Content-Type-Options: nosniff");
header("Cache-Control: no-store");
header("Access-Control-Allow-Origin: https://ossatura.duckdns.org");
header("Vary: Origin");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["ok" => false, "error" => "Méthode non autorisée."]);
    exit;
}

$configPath = __DIR__ . "/forms/config.php";
if (!is_readable($configPath)) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Configuration indisponible."]);
    exit;
}

/** @var array{hmac_secret?:string} $cfg */
$cfg = require $configPath;
$secret = (string)($cfg["hmac_secret"] ?? "");
if ($secret === "" || strlen($secret) < 24) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Configuration sécurité incomplete."]);
    exit;
}

$ts = (string)time();
$token = $ts . "." . hash_hmac("sha256", $ts, $secret);

echo json_encode([
    "ok" => true,
    "token" => $token,
    "min_wait_ms" => 3000,
]);
