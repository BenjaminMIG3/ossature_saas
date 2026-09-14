<?php
declare(strict_types=1);

/**
 * Endpoint de démo Ossatura — protections anti-bot / anti-spam.
 *
 * - Méthode POST uniquement
 * - Contrôle Origin / Referer
 * - Honeypot
 * - Jeton HMAC daté (délai min / max)
 * - Rate limiting par IP
 * - Validation & heuristiques de contenu
 */

header("Content-Type: application/json; charset=utf-8");
header("X-Content-Type-Options: nosniff");
header("Referrer-Policy: same-origin");
header("Cache-Control: no-store");

const FORM_MIN_SECONDS = 3;
const FORM_MAX_SECONDS = 7200;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 3600;
const ALLOWED_HOSTS = ["ossatura.duckdns.org", "www.ossatura.duckdns.org"];

function respond(int $status, array $payload): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function client_ip(): string {
    $ip = $_SERVER["REMOTE_ADDR"] ?? "0.0.0.0";
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : "0.0.0.0";
}

function field(string $key, int $max = 500): string {
    $value = trim((string)($_POST[$key] ?? ""));
    $value = preg_replace("/[\r\n]+/", " ", $value) ?? "";
    return substr($value, 0, $max);
}

function reject_quietly(): never {
    // Réponse générique pour ne pas aider les bots à profiler les filtres.
    respond(400, ["ok" => false, "error" => "Envoi refusé."]);
}

function origin_allowed(): bool {
    $candidates = [];
    $origin = $_SERVER["HTTP_ORIGIN"] ?? "";
    $referer = $_SERVER["HTTP_REFERER"] ?? "";
    if ($origin !== "") {
        $candidates[] = $origin;
    }
    if ($referer !== "") {
        $candidates[] = $referer;
    }
    if ($candidates === []) {
        return false;
    }
    foreach ($candidates as $url) {
        $host = strtolower((string)(parse_url($url, PHP_URL_HOST) ?? ""));
        if (in_array($host, ALLOWED_HOSTS, true)) {
            return true;
        }
    }
    return false;
}

function verify_token(string $token, string $secret): bool {
    $parts = explode(".", $token, 2);
    if (count($parts) !== 2) {
        return false;
    }
    [$tsRaw, $sig] = $parts;
    if (!ctype_digit($tsRaw) || $sig === "") {
        return false;
    }
    $ts = (int)$tsRaw;
    $now = time();
    $age = $now - $ts;
    if ($age < FORM_MIN_SECONDS || $age > FORM_MAX_SECONDS) {
        return false;
    }
    $expected = hash_hmac("sha256", $tsRaw, $secret);
    return hash_equals($expected, $sig);
}

function rate_limited(string $ip, string $dir): bool {
    if (!is_dir($dir) && !mkdir($dir, 0770, true) && !is_dir($dir)) {
        return true;
    }
    $file = $dir . "/" . hash("sha256", $ip) . ".json";
    $fh = fopen($file, "c+");
    if ($fh === false) {
        return true;
    }
    try {
        if (!flock($fh, LOCK_EX)) {
            return true;
        }
        $raw = stream_get_contents($fh);
        $hits = [];
        if (is_string($raw) && $raw !== "") {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $hits = array_values(array_filter(
                    array_map("intval", $decoded),
                    static fn(int $t): bool => ($t >= time() - RATE_LIMIT_WINDOW)
                ));
            }
        }
        if (count($hits) >= RATE_LIMIT_MAX) {
            return true;
        }
        $hits[] = time();
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, json_encode($hits));
        fflush($fh);
        flock($fh, LOCK_UN);
        return false;
    } finally {
        fclose($fh);
    }
}

function looks_like_spam(string $email, string $message, string $prenom, string $nom, string $entreprise): bool {
    $blob = strtolower($prenom . " " . $nom . " " . $entreprise . " " . $message . " " . $email);
    if (preg_match('/https?:\/\//', $message) && preg_match_all('/https?:\/\//', $message) >= 2) {
        return true;
    }
    $spamWords = ["viagra", "casino", "crypto airdrop", "seo backlink", "porn", "xxx", "loan online"];
    foreach ($spamWords as $word) {
        if (str_contains($blob, $word)) {
            return true;
        }
    }
    $disposable = ["mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "yopmail.com", "trashmail.com"];
    $domain = strtolower((string)substr(strrchr($email, "@") ?: "", 1));
    if ($domain !== "" && in_array($domain, $disposable, true)) {
        return true;
    }
    // Contenu quasi vide / caractères aléatoires très denses
    $alnum = preg_replace("/[^a-z0-9]/i", "", $message) ?? "";
    if (strlen($message) > 80 && strlen($alnum) / max(strlen($message), 1) > 0.92 && !preg_match("/\s/", $message)) {
        return true;
    }
    return false;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    respond(405, ["ok" => false, "error" => "Méthode non autorisée."]);
}

if (!origin_allowed()) {
    reject_quietly();
}

$configPath = __DIR__ . "/forms/config.php";
if (!is_readable($configPath)) {
    respond(500, ["ok" => false, "error" => "Configuration mail indisponible."]);
}

/** @var array{to:string,from_email:string,from_name:string,smtp_host:string,smtp_port:int,smtp_user:string,smtp_pass:string,hmac_secret?:string} $cfg */
$cfg = require $configPath;
$secret = (string)($cfg["hmac_secret"] ?? "");
if ($secret === "" || strlen($secret) < 24) {
    respond(500, ["ok" => false, "error" => "Configuration sécurité incomplete."]);
}

// Honeypot : doit rester vide.
$honeypot = trim((string)($_POST["website"] ?? $_POST["company_url"] ?? ""));
if ($honeypot !== "") {
    reject_quietly();
}

$token = trim((string)($_POST["form_token"] ?? ""));
if ($token === "" || !verify_token($token, $secret)) {
    reject_quietly();
}

$rateDir = __DIR__ . "/forms/runtime/rate";
if (rate_limited(client_ip(), $rateDir)) {
    respond(429, ["ok" => false, "error" => "Trop de demandes. Réessayez dans une heure."]);
}

$prenom = field("prenom", 80);
$nom = field("nom", 80);
$entreprise = field("entreprise", 120);
$email = filter_var(field("email", 180), FILTER_VALIDATE_EMAIL);
$metier = field("metier", 80);
$effectif = field("effectif", 40);
$message = trim((string)($_POST["message"] ?? ""));
$message = substr($message, 0, 4000);

if ($prenom === "" || $nom === "" || $entreprise === "" || $email === false) {
    respond(422, ["ok" => false, "error" => "Merci de remplir correctement les champs obligatoires."]);
}

if (looks_like_spam($email, $message, $prenom, $nom, $entreprise)) {
    reject_quietly();
}

$subject = "[Ossatura] Demande de démo — {$prenom} {$nom} ({$entreprise})";

$payload = [
    "cfg" => [
        "to" => $cfg["to"],
        "from_email" => $cfg["from_email"],
        "from_name" => $cfg["from_name"],
        "smtp_host" => $cfg["smtp_host"],
        "smtp_port" => $cfg["smtp_port"],
        "smtp_user" => $cfg["smtp_user"],
        "smtp_pass" => $cfg["smtp_pass"],
    ],
    "to" => $cfg["to"],
    "reply_to" => $email,
    "subject" => $subject,
    "prenom" => $prenom,
    "nom" => $nom,
    "entreprise" => $entreprise,
    "email" => $email,
    "metier" => $metier,
    "effectif" => $effectif,
    "message" => $message,
];

$tmp = tempnam(sys_get_temp_dir(), "oss_mail_");
if ($tmp === false) {
    respond(500, ["ok" => false, "error" => "Impossible de préparer l'envoi."]);
}

file_put_contents($tmp, json_encode($payload, JSON_UNESCAPED_UNICODE));

$cmd = "python3 " . escapeshellarg(__DIR__ . "/forms/send_mail.py") . " " . escapeshellarg($tmp);
exec($cmd . " 2>&1", $out, $code);
@unlink($tmp);

if ($code !== 0) {
    respond(502, ["ok" => false, "error" => "L'e-mail n'a pas pu être envoyé. Réessayez plus tard."]);
}

respond(200, ["ok" => true, "message" => "Demande envoyée. Nous vous répondons sous un jour ouvré."]);
