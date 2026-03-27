<?php

/**
 * OpenRouter — API tương thích OpenAI Chat Completions.
 * Biến môi trường: OPENROUTER_API_KEY, OPENROUTER_MODEL,
 * tùy chọn OPENROUTER_APP_URL (HTTP-Referer), OPENROUTER_APP_NAME (X-Title).
 * Hoặc file openrouter.local.php (đã gitignore).
 */
class OpenRouterConfig
{
    public static function apiKey(): string
    {
        $k = getenv('OPENROUTER_API_KEY');
        if (is_string($k) && $k !== '') {
            return $k;
        }
        $path = __DIR__ . '/openrouter.local.php';
        if (is_file($path)) {
            $c = include $path;
            if (is_array($c) && !empty($c['api_key'])) {
                return (string)$c['api_key'];
            }
        }
        return '';
    }

    public static function model(): string
    {
        $m = getenv('OPENROUTER_MODEL');
        if (is_string($m) && $m !== '') {
            return $m;
        }
        $path = __DIR__ . '/openrouter.local.php';
        if (is_file($path)) {
            $c = include $path;
            if (is_array($c) && !empty($c['model'])) {
                return (string)$c['model'];
            }
        }
        return 'google/gemini-2.0-flash-001';
    }

    public static function appUrl(): string
    {
        $u = getenv('OPENROUTER_APP_URL');
        if (is_string($u) && $u !== '') {
            return $u;
        }
        $path = __DIR__ . '/openrouter.local.php';
        if (is_file($path)) {
            $c = include $path;
            if (is_array($c) && !empty($c['app_url'])) {
                return (string)$c['app_url'];
            }
        }
        return 'http://localhost:8080';
    }

    public static function appName(): string
    {
        $n = getenv('OPENROUTER_APP_NAME');
        if (is_string($n) && $n !== '') {
            return $n;
        }
        $path = __DIR__ . '/openrouter.local.php';
        if (is_file($path)) {
            $c = include $path;
            if (is_array($c) && !empty($c['app_name'])) {
                return (string)$c['app_name'];
            }
        }
        return 'PhoneStore POS';
    }
}
