<?php
declare(strict_types=1);

// Security baseline from the PHP project's 2026-10-21 engine advisory.
// Vendor backports need separate provenance; version strings cannot attest them.
$minimum = [802 => 80235, 803 => 80336, 804 => 80427, 805 => 80512];
$branch = intdiv(PHP_VERSION_ID, 100);
$passed = isset($minimum[$branch]) && PHP_VERSION_ID >= $minimum[$branch];
echo json_encode([
    'passed' => $passed,
    'version' => PHP_VERSION,
    'sapi' => PHP_SAPI,
    'advisory' => 'CVE-2026-109618 / CVE-2026-109619',
    'baseline' => '2026-10-21',
], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), PHP_EOL;
if (!$passed) {
    fwrite(STDERR, "PHP must be a supported patched branch: 8.2.35, 8.3.36, 8.4.27, 8.5.12 or a later patch on one of those branches. Verify other branches/vendor backports separately.\n");
    exit(1);
}
