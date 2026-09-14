<?php
declare(strict_types=1);

return [
    "to" => "benjamin.dusunceli@gmail.com",
    "from_email" => "benjamin.dusunceli@gmail.com",
    "from_name" => "Ossatura",
    "smtp_host" => "smtp-relay.brevo.com",
    "smtp_port" => 587,
    "smtp_user" => "YOUR_BREVO_SMTP_USER",
    "smtp_pass" => "YOUR_BREVO_SMTP_PASSWORD",
    // Secret long et aléatoire pour les jetons anti-bot du formulaire
    "hmac_secret" => "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_32+_CHARS",
];
