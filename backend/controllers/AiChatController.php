<?php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../services/AiChatService.php';

class AiChatController
{
    private $db;
    private $service;

    /** Tối đa số request trong cửa sổ thời gian */
    private const RATE_WINDOW_SEC = 600;
    private const RATE_MAX = 30;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->service = new AiChatService($db);
    }

    public function chat(array $data): void
    {
        AuthMiddleware::checkAuth();

        if (isset($_SESSION['is_first_login']) && $_SESSION['is_first_login'] === true) {
            Response::json(['message' => 'Vui lòng đổi mật khẩu lần đầu trước khi dùng trợ lý AI.'], 403);
            return;
        }

        $this->enforceRateLimit();

        $message = isset($data['message']) ? trim((string)$data['message']) : '';
        $role = $_SESSION['role'] ?? 'staff';
        $isAdmin = ($role === 'admin');

        $result = $this->service->runChat($message, $isAdmin);
        if (!$result['ok']) {
            Response::json(['message' => $result['error'] ?? 'Lỗi không xác định'], 400);
            return;
        }

        Response::json([
            'reply' => $result['reply'],
        ]);
    }

    private function enforceRateLimit(): void
    {
        $now = time();
        if (!isset($_SESSION['ai_chat_rate']) || !is_array($_SESSION['ai_chat_rate'])) {
            $_SESSION['ai_chat_rate'] = [];
        }
        $cut = $now - self::RATE_WINDOW_SEC;
        $timestamps = array_filter(
            $_SESSION['ai_chat_rate'],
            static function ($t) use ($cut) {
                return is_int($t) && $t > $cut;
            }
        );
        if (count($timestamps) >= self::RATE_MAX) {
            Response::json([
                'message' => 'Bạn gửi quá nhiều yêu cầu AI. Vui lòng thử lại sau vài phút.',
            ], 429);
        }
        $timestamps[] = $now;
        $_SESSION['ai_chat_rate'] = array_values($timestamps);
    }
}
