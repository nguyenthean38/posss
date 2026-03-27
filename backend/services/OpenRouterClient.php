<?php

require_once __DIR__ . '/../config/OpenRouterConfig.php';

/**
 * OpenRouter — POST /api/v1/chat/completions (OpenAI-compatible), chỉ curl + json.
 */
class OpenRouterClient
{
    private const TIMEOUT_SEC = 60;
    private const URL = 'https://openrouter.ai/api/v1/chat/completions';

    /**
     * @return array{ok:bool, text?:string, error?:string, raw_status?:int}
     */
    public function chatCompletion(string $systemInstruction, string $userText, int $maxTokens = 1024): array
    {
        $apiKey = OpenRouterConfig::apiKey();
        if ($apiKey === '') {
            return ['ok' => false, 'error' => 'Chưa cấu hình OPENROUTER_API_KEY (hoặc config/openrouter.local.php).'];
        }

        $model = OpenRouterConfig::model();
        $body = [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $systemInstruction],
                ['role' => 'user', 'content' => $userText],
            ],
            'max_tokens' => $maxTokens,
            'temperature' => 0.35,
        ];

        $json = json_encode($body, JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            return ['ok' => false, 'error' => 'Không mã hóa JSON được.'];
        }

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
            'Referer: ' . OpenRouterConfig::appUrl(),
            'X-Title: ' . OpenRouterConfig::appName(),
        ];

        $ch = curl_init(self::URL);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => self::TIMEOUT_SEC,
        ]);
        $resp = curl_exec($ch);
        $errno = curl_errno($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($errno !== 0) {
            return ['ok' => false, 'error' => 'Lỗi mạng khi gọi OpenRouter.', 'raw_status' => $status];
        }

        $data = json_decode((string)$resp, true);
        if (!is_array($data)) {
            return ['ok' => false, 'error' => 'Phản hồi OpenRouter không phải JSON.', 'raw_status' => $status];
        }

        if ($status >= 400) {
            $msg = $data['error']['message'] ?? $data['message'] ?? ('HTTP ' . $status);
            if (is_array($msg)) {
                $msg = json_encode($msg, JSON_UNESCAPED_UNICODE);
            }
            return ['ok' => false, 'error' => (string)$msg, 'raw_status' => $status];
        }

        $text = '';
        if (!empty($data['choices'][0]['message']['content'])) {
            $text = (string)$data['choices'][0]['message']['content'];
        }
        $text = trim($text);
        if ($text === '') {
            return ['ok' => false, 'error' => 'OpenRouter trả về nội dung rỗng.', 'raw_status' => $status];
        }

        return ['ok' => true, 'text' => $text];
    }
}
