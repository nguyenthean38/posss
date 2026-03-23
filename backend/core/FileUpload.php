<?php
class FileUpload {
    /**
     * Upload file ảnh với validation
     * 
     * @param array $file $_FILES['field_name']
     * @param string $uploadDir Thư mục upload (vd: 'products', 'avatars', 'customers')
     * @param string $prefix Tiền tố tên file (vd: 'product_', 'user_', 'customer_')
     * @param int $maxSize Kích thước tối đa (bytes), default 2MB
     * @return string|false Đường dẫn file nếu thành công, false nếu thất bại
     */
    public static function uploadImage($file, $uploadDir, $prefix = '', $maxSize = 2097152) {
        // Kiểm tra có file không
        if (!isset($file) || $file['error'] === UPLOAD_ERR_NO_FILE) {
            return false;
        }

        // Kiểm tra lỗi upload
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception("Lỗi upload file");
        }

        $fileTmp = $file['tmp_name'];
        $fileSize = $file['size'];

        // Kiểm tra kích thước
        if ($fileSize > $maxSize) {
            throw new Exception("File vượt quá " . ($maxSize / 1024 / 1024) . "MB");
        }

        // Kiểm tra định dạng
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $fileTmp);
        finfo_close($finfo);

        $allowed = [
            'image/jpeg' => '.jpg',
            'image/png' => '.png',
            'image/gif' => '.gif',
            'image/webp' => '.webp'
        ];

        if (!isset($allowed[$mimeType])) {
            throw new Exception("Chỉ hỗ trợ ảnh JPG, PNG, GIF, WEBP");
        }

        $extension = $allowed[$mimeType];

        // Tạo tên file an toàn
        $safeBaseName = $prefix . time() . '_' . bin2hex(random_bytes(4));
        $safeFileName = $safeBaseName . $extension;

        // Tạo thư mục nếu chưa có
        $uploadPath = __DIR__ . '/../uploads/' . $uploadDir;
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0777, true);
        }

        $targetPath = $uploadPath . '/' . $safeFileName;

        // Di chuyển file
        if (!move_uploaded_file($fileTmp, $targetPath)) {
            throw new Exception("Không thể lưu file trên server");
        }

        // Trả về đường dẫn tương đối
        return 'uploads/' . $uploadDir . '/' . $safeFileName;
    }

    /**
     * Xóa file ảnh cũ
     * 
     * @param string $filePath Đường dẫn file (vd: 'uploads/products/product_123.jpg')
     * @return bool
     */
    public static function deleteFile($filePath) {
        if (empty($filePath)) {
            return false;
        }

        $fullPath = __DIR__ . '/../' . $filePath;
        
        if (file_exists($fullPath) && is_file($fullPath)) {
            return unlink($fullPath);
        }

        return false;
    }
}
