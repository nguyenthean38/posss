<?php

/**
 * Đọc file .env ở thư mục gốc project (cạnh backend/) — không dùng Composer.
 * Chỉ gán biến nếu chưa có trong getenv (Docker/host có thể đã set sẵn).
 */
class EnvLoader
{
    private static $loaded = false;

    public static function loadFromProjectRoot(): void
    {
        if (self::$loaded) {
            return;
        }
        self::$loaded = true;

        // 1) .env ở gốc project (cạnh backend/) — chạy PHP trên host
        // 2) backend/.env — tiện khi Docker chỉ mount ./backend (file nằm trong volume)
        $candidates = [
            dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env',
            dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env',
        ];
        $path = null;
        foreach ($candidates as $p) {
            if (is_readable($p)) {
                $path = $p;
                break;
            }
        }
        if ($path === null) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') {
                continue;
            }
            if (!str_contains($line, '=')) {
                continue;
            }
            [$name, $value] = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            if ($name === '') {
                continue;
            }
            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }
            if (getenv($name) !== false && getenv($name) !== '') {
                continue;
            }
            putenv("$name=$value");
            $_ENV[$name] = $value;
        }
    }
}
