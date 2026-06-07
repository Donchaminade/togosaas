<?php

declare(strict_types=1);

/**
 * Seeder : insere le compte administrateur, un lead de demonstration
 * et un jeu de communautes deja approuvees.
 *
 *   php database/seed.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use TCH\Database;

$pdo = Database::connection();

echo "==> TCH : seed des donnees initiales\n";

/* ------------------------------------------------------------------ */
/* Administrateur                                                      */
/* ------------------------------------------------------------------ */
$adminEmail = strtolower((string) env('ADMIN_EMAIL', 'admin@tch.tg'));
$adminName = (string) env('ADMIN_NAME', 'Administrateur TCH');
$adminPass = (string) env('ADMIN_PASSWORD', 'Admin@1234');

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email');
$stmt->execute(['email' => $adminEmail]);
$adminId = $stmt->fetchColumn();

if (!$adminId) {
    $insert = $pdo->prepare(
        'INSERT INTO users (name, email, password_hash, role, created_at)
         VALUES (:name, :email, :hash, :role, NOW())'
    );
    $insert->execute([
        'name' => $adminName,
        'email' => $adminEmail,
        'hash' => password_hash($adminPass, PASSWORD_BCRYPT),
        'role' => 'admin',
    ]);
    $adminId = (int) $pdo->lastInsertId();
    echo "    [OK] Admin cree : {$adminEmail} (mot de passe : {$adminPass})\n";
} else {
    echo "    [=] Admin deja present : {$adminEmail}\n";
}

/* ------------------------------------------------------------------ */
/* Lead de demonstration                                               */
/* ------------------------------------------------------------------ */
$leadEmail = 'lead.demo@tch.tg';
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email');
$stmt->execute(['email' => $leadEmail]);
$leadId = $stmt->fetchColumn();

if (!$leadId) {
    $insert = $pdo->prepare(
        'INSERT INTO users (name, email, password_hash, phone, role, created_at)
         VALUES (:name, :email, :hash, :phone, :role, NOW())'
    );
    $insert->execute([
        'name' => 'Lead Demo',
        'email' => $leadEmail,
        'hash' => password_hash('Lead@1234', PASSWORD_BCRYPT),
        'phone' => '+228 90 00 00 00',
        'role' => 'lead',
    ]);
    $leadId = (int) $pdo->lastInsertId();
    echo "    [OK] Lead demo cree : {$leadEmail} (mot de passe : Lead@1234)\n";
} else {
    echo "    [=] Lead demo deja present : {$leadEmail}\n";
}

/* ------------------------------------------------------------------ */
/* Communautes                                                         */
/* ------------------------------------------------------------------ */
$communities = require __DIR__ . '/seeds/communities.php';

$existing = (int) $pdo->query('SELECT COUNT(*) FROM communities')->fetchColumn();
if ($existing > 0) {
    echo "    [=] {$existing} communaute(s) deja en base, seed ignore.\n";
} else {
    $insert = $pdo->prepare(
        'INSERT INTO communities
            (user_id, name, description, short_description, mission, country, city, tags,
             logo_url, banner_url, whatsapp_url, telegram_url, linkedin_url, twitter_url, website_url,
             lat, lng, leader_name, leader_email, leader_phone, leader_photo_url, leader_bio,
             co_leads, gallery, founded_year, member_count, meeting_info, public_email,
             status, created_at, updated_at)
         VALUES
            (:user_id, :name, :description, :short_description, :mission, :country, :city, :tags,
             :logo_url, :banner_url, :whatsapp_url, :telegram_url, :linkedin_url, :twitter_url, :website_url,
             :lat, :lng, :leader_name, :leader_email, :leader_phone, :leader_photo_url, :leader_bio,
             :co_leads, :gallery, :founded_year, :member_count, :meeting_info, :public_email,
             :status, NOW(), NOW())'
    );

    foreach ($communities as $c) {
        $insert->execute([
            'user_id' => $leadId,
            'name' => $c['name'],
            'description' => $c['description'],
            'short_description' => $c['shortDescription'] ?? null,
            'mission' => $c['mission'] ?? null,
            'country' => $c['country'] ?? 'Togo',
            'city' => $c['city'] ?? null,
            'tags' => json_encode($c['tags'], JSON_UNESCAPED_UNICODE),
            'logo_url' => $c['logoUrl'] ?? null,
            'banner_url' => $c['bannerUrl'] ?? null,
            'whatsapp_url' => $c['whatsappUrl'] ?? null,
            'telegram_url' => $c['telegramUrl'] ?? null,
            'linkedin_url' => $c['linkedinUrl'] ?? null,
            'twitter_url' => $c['twitterUrl'] ?? null,
            'website_url' => $c['websiteUrl'] ?? null,
            'lat' => $c['lat'] ?? null,
            'lng' => $c['lng'] ?? null,
            'leader_name' => $c['leaderName'],
            'leader_email' => $c['leaderEmail'],
            'leader_phone' => $c['leaderPhone'] ?? null,
            'leader_photo_url' => $c['leaderPhotoUrl'] ?? null,
            'leader_bio' => $c['leaderBio'] ?? null,
            'co_leads' => json_encode($c['coLeads'] ?? [], JSON_UNESCAPED_UNICODE),
            'gallery' => json_encode($c['gallery'] ?? [], JSON_UNESCAPED_UNICODE),
            'founded_year' => $c['foundedYear'] ?? null,
            'member_count' => $c['memberCount'] ?? null,
            'meeting_info' => $c['meetingInfo'] ?? null,
            'public_email' => $c['publicEmail'] ?? null,
            'status' => 'approved',
        ]);
    }
    echo "    [OK] " . count($communities) . " communaute(s) inseree(s).\n";
}

echo "==> Seed termine.\n";
