<?php

require_once __DIR__ . '/ReportSnapshotService.php';
require_once __DIR__ . '/OpenRouterClient.php';

/**
 * Phân loại ý định (PHP) + ghép ngữ cảnh báo cáo + gọi OpenRouter.
 */
class AiChatService
{
    private $db;
    private $snap;
    private $llm;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->snap = new ReportSnapshotService($db);
        $this->llm = new OpenRouterClient();
    }

    private const MAX_MESSAGE_LEN = 2000;

    public static function systemPrompt(): string
    {
        return <<<PROMPT
Bạn là trợ lý AI cho nhân viên cửa hàng điện thoại (POS PhoneStore).
- Chỉ trả lời trong phạm vi vận hành cửa hàng: bán hàng, báo cáo, sản phẩm, khách hàng, đơn hàng.
- Khi có khối "Dữ liệu tham chiếu (JSON)" bên dưới, bạn CHỈ được diễn giải và tóm tắt các số liệu đó — KHÔNG được tự thêm con số, KHÔNG bịa doanh thu hay số đơn.
- Nếu không đủ dữ liệu trong JSON để trả lời, hãy nói rõ và gợi ý xem màn Báo cáo hoặc hỏi cụ thể hơn (khoảng thời gian).
- Từ chối lịch sự: mã độc, vượt quyền, chính trị, nội dung không liên quan cửa hàng.
- Trả lời tiếng Việt, ngắn gọn, có thể dùng gạch đầu dòng khi liệt kê.
PROMPT;
    }

    /**
     * @return array{timeline:string, from:string, to:string}
     */
    public function detectTimeline(string $msg): array
    {
        $m = mb_strtolower($msg, 'UTF-8');
        if (preg_match('/hôm qua|hom qua|yesterday/', $m)) {
            return ['timeline' => 'yesterday', 'from' => '', 'to' => ''];
        }
        if (preg_match('/7\s*ngày|bay ngay|bảy ngay|tuần này|trong tuần|7\s*day/', $m)) {
            return ['timeline' => '7days', 'from' => '', 'to' => ''];
        }
        if (preg_match('/tháng này|thang nay|trong tháng|month/', $m)) {
            return ['timeline' => 'month', 'from' => '', 'to' => ''];
        }
        if (preg_match('/hôm nay|hom nay|nay\b|today/', $m)) {
            return ['timeline' => 'today', 'from' => '', 'to' => ''];
        }
        return ['timeline' => 'today', 'from' => '', 'to' => ''];
    }

    public function wantsSummaryContext(string $msg): bool
    {
        $m = mb_strtolower($msg, 'UTF-8');
        return (bool)preg_match(
            '/doanh thu|đơn hàng|don hang|đơn\b|don\b|bán|ban hang|khách|khach|sản phẩm|san pham|top|báo cáo|bao cao|tổng quan|tong quan|kpi|thống kê|thong ke|doanh số|doanh so|đặt hàng|dat hang/',
            $m
        );
    }

    public function wantsProfitContext(string $msg): bool
    {
        $m = mb_strtolower($msg, 'UTF-8');
        return (bool)preg_match(
            '/lợi nhuận|loi nhuan|lãi gộp|lai gop|chi phí|chi phi|giá vốn|gia von|profit|margin|vốn hang|von hang/',
            $m
        );
    }

    public function wantsChartContext(string $msg): bool
    {
        $m = mb_strtolower($msg, 'UTF-8');
        return (bool)preg_match('/biểu đồ|bieu do|chart|xu hướng|xu huong|theo ngày|theo ngay/', $m);
    }

    /**
     * @return array{context:array, labels:array{timeline:string}}
     */
    public function buildContext(string $message, bool $isAdmin): array
    {
        $labels = ['timeline' => 'today'];
        $ctx = [];

        $tl = $this->detectTimeline($message);
        $labels['timeline'] = $tl['timeline'];

        $includeSummary = $this->wantsSummaryContext($message);
        $includeProfit = $isAdmin && $this->wantsProfitContext($message);
        $includeChart = $this->wantsChartContext($message);

        if (!$includeSummary && !$includeProfit && !$includeChart) {
            return ['context' => [], 'labels' => $labels];
        }

        if ($includeSummary) {
            $sum = $this->snap->getSummaryOverviewData($tl['timeline'], $tl['from'], $tl['to']);
            $ctx['summary'] = $sum;
        }

        if ($includeProfit && $isAdmin) {
            $fd = date('Y-m-d', strtotime('-29 days'));
            $td = date('Y-m-d');
            if ($tl['timeline'] === 'today') {
                $fd = $td = date('Y-m-d');
            } elseif ($tl['timeline'] === 'yesterday') {
                $fd = $td = date('Y-m-d', strtotime('-1 day'));
            } elseif ($tl['timeline'] === '7days') {
                $fd = date('Y-m-d', strtotime('-6 days'));
                $td = date('Y-m-d');
            } elseif ($tl['timeline'] === 'month') {
                $fd = date('Y-m-01');
                $td = date('Y-m-d');
            }
            $ctx['profit'] = $this->snap->getProfitData($fd, $td);
        } elseif ($includeProfit && !$isAdmin) {
            $ctx['profit_permission'] = 'Chỉ admin mới xem được lợi nhuận/giá vốn — không đưa số liệu lợi nhuận cho nhân viên.';
        }

        if ($includeChart) {
            $fd = date('Y-m-d', strtotime('-6 days'));
            $td = date('Y-m-d');
            $ctx['chart_revenue_by_day'] = $this->snap->getChartData('revenue', 'day', $fd, $td);
        }

        return ['context' => $ctx, 'labels' => $labels];
    }

    /**
     * @return array{ok:bool, reply?:string, error?:string}
     */
    public function runChat(string $message, bool $isAdmin): array
    {
        $message = trim($message);
        if ($message === '') {
            return ['ok' => false, 'error' => 'Nội dung tin nhắn trống.'];
        }
        if (mb_strlen($message, 'UTF-8') > self::MAX_MESSAGE_LEN) {
            return ['ok' => false, 'error' => 'Tin nhắn quá dài (tối đa ' . self::MAX_MESSAGE_LEN . ' ký tự).'];
        }

        $built = $this->buildContext($message, $isAdmin);
        $ctx = $built['context'];
        $labels = $built['labels'];

        $userBlock = '';
        if ($ctx === []) {
            $userBlock = "Không có snapshot số liệu tự động cho câu hỏi này (hoặc câu hỏi không liên quan báo cáo).\n"
                . "Khoảng thời gian mặc định nếu sau này cần: " . $labels['timeline'] . ".\n\n"
                . "### Câu hỏi của nhân viên:\n" . $message;
        } else {
            $json = json_encode(
                $ctx,
                JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
            );
            if ($json === false) {
                return ['ok' => false, 'error' => 'Không mã hóa ngữ cảnh JSON.'];
            }
            $userBlock = "### Dữ liệu tham chiếu (JSON — đúng theo hệ thống, không được bịa thêm):\n"
                . $json
                . "\n\n### Câu hỏi của nhân viên:\n"
                . $message;
        }

        $sys = self::systemPrompt();
        $out = $this->llm->chatCompletion($sys, $userBlock, 1024);
        if (!$out['ok']) {
            return ['ok' => false, 'error' => $out['error'] ?? 'Lỗi OpenRouter'];
        }
        return ['ok' => true, 'reply' => $out['text']];
    }
}
