<?php
class ProfileController {
    private $db;
    private $userModel;
    private $logModel;

    public function __construct($db) {
        $this->db = $db;
        $this->userModel = new User($db);
        $this->logModel = new Log($db);
    }

    public function getMyProfile() {
        AuthMiddleware::checkAuth();
        $userId = $_SESSION['user_id'];
        $profile = $this->userModel->getProfileById($userId);
        Response::json($profile);
    }

    public function updateProfile($data) {
        AuthMiddleware::checkAuth();
        $userId = $_SESSION['user_id'];
        $fullName = isset($data['HoTen']) ? trim($data['HoTen']) : null;
        
        if ($this->userModel->updateProfile($userId, $fullName, null)) {
            $this->logModel->createLog($userId, 'update_profile', 'Cập nhật hồ sơ cá nhân');
            Response::json(["message" => "Cập nhật thành công"]);
        } else {
            Response::json(["message" => "Không có gì thay đổi"], 400);
        }
    }

    public function uploadAvatar() {
        AuthMiddleware::checkAuth();
        $userId = $_SESSION['user_id'];
        if (isset($_FILES['Image']) && $_FILES['Image']['error'] === UPLOAD_ERR_OK) {
            $fileTmp = $_FILES['Image']['tmp_name'];
            $fileSize = $_FILES['Image']['size'];
            $maxSize = 2 * 1024 * 1024;
            if ($fileSize > $maxSize) Response::json(["message" => "Ảnh vượt quá 2MB"], 400);

            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $fileTmp);
            finfo_close($finfo);
            $allowed = ['image/jpeg' => '.jpg', 'image/png' => '.png'];
            if (!isset($allowed[$mimeType])) Response::json(["message" => "Chỉ hỗ trợ JPG/PNG"], 400);

            $extension = $allowed[$mimeType];
            $safeFileName = 'user_' . $userId . '_' . time() . $extension;
            $uploadDir = __DIR__ . '/../uploads/avatars';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            
            $targetPath = $uploadDir . '/' . $safeFileName;
            if (move_uploaded_file($fileTmp, $targetPath)) {
                $avatarPath = 'uploads/avatars/' . $safeFileName;
                $this->userModel->updateProfile($userId, null, $avatarPath);
                $this->logModel->createLog($userId, 'upload_avatar', 'Cập nhật ảnh đại diện');
                Response::json(["ImageUrl" => $avatarPath, "Message" => "Cập nhật ảnh đại diện thành công"]);
            }
        }
        Response::json(["message" => "Lỗi upload ảnh hoặc chưa chọn file"], 400);
    }
}
