<?php

class ProductController {
    private $productModel;
    private $categoryModel;
    private $logModel;

    public function __construct($db) {
        $this->productModel = new Product($db);
        $this->categoryModel = new Category($db);
        $this->logModel = new Log($db);
    }

    // [GET] /api/products
    // UC-19: Xem danh sách sản phẩm theo phân quyền
    public function index() {
        AuthMiddleware::checkAuth();

        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 20;
        $keyword = isset($_GET['q']) ? trim($_GET['q']) : '';
        $categoryId = isset($_GET['category_id']) ? trim($_GET['category_id']) : null;

        $result = $this->productModel->getList($page, $limit, $keyword, $categoryId);

        $role = $_SESSION['role'] ?? 'staff';

        // Nếu là nhân viên bán hàng -> ẩn giá nhập (import_price)
        if ($role !== 'admin') {
            foreach ($result['items'] as &$item) {
                unset($item['import_price']);
            }
            $this->logModel->createLog($_SESSION['user_id'], 'view_products_staff', 'Nhân viên xem danh sách sản phẩm');
        } else {
            $this->logModel->createLog($_SESSION['user_id'], 'view_products', 'Admin xem danh sách sản phẩm');
        }

        Response::json($result);
    }

    // [GET] /api/products/{id}
    public function show($id) {
        AuthMiddleware::checkAuth();
        $id = (int)$id;
        $product = $this->productModel->findById($id);
        if (!$product) {
            Response::json(["message" => "Sản phẩm không tồn tại"], 404);
        }
        $role = $_SESSION['role'] ?? 'staff';
        if ($role !== 'admin') {
            unset($product['import_price']);
        }
        $this->logModel->createLog($_SESSION['user_id'], 'view_product_detail', 'Xem chi tiết sản phẩm ID=' . $id);
        Response::json($product);
    }

    // [POST] /api/products
    public function store($data) {
        AuthMiddleware::checkAdmin();

        $categoryId = isset($data['category_id']) ? (int)$data['category_id'] : 0;
        $name = isset($data['product_name']) ? trim($data['product_name']) : '';
        $barcode = isset($data['barcode']) ? trim($data['barcode']) : '';
        $importPrice = isset($data['import_price']) ? (float)$data['import_price'] : 0;
        $sellingPrice = isset($data['selling_price']) ? (float)$data['selling_price'] : 0;
        $stockQuantity = isset($data['stock_quantity']) ? (int)$data['stock_quantity'] : 0;

        if ($categoryId <= 0 || $name === '' || $barcode === '' || $importPrice < 0 || $sellingPrice < 0) {
            Response::json(["message" => "Dữ liệu sản phẩm không hợp lệ"], 400);
        }

        // Kiểm tra giá bán phải >= giá nhập (tránh bán lỗ)
        if ($sellingPrice < $importPrice) {
            Response::json(["message" => "Giá bán phải lớn hơn hoặc bằng giá nhập"], 400);
        }

        // Kiểm tra danh mục tồn tại
        if (!$this->categoryModel->findById($categoryId)) {
            Response::json(["message" => "Danh mục không tồn tại"], 400);
        }

        // Kiểm tra trùng mã vạch
        if ($this->productModel->existsBarcode($barcode)) {
            Response::json(["message" => "Mã vạch đã tồn tại trong hệ thống"], 400);
        }

        // Upload ảnh sản phẩm (BẮT BUỘC)
        $imagePath = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
            try {
                $imagePath = FileUpload::uploadImage($_FILES['image'], 'products', 'product_');
            } catch (Exception $e) {
                Response::json(["message" => $e->getMessage()], 400);
            }
        }

        // Ảnh sản phẩm là BẮT BUỘC
        if ($imagePath === null) {
            Response::json(["message" => "Ảnh sản phẩm là bắt buộc"], 400);
        }

        $newId = $this->productModel->create($categoryId, $name, $barcode, $imagePath, $importPrice, $sellingPrice, $stockQuantity);
        if ($newId) {
            $this->logModel->createLog($_SESSION['user_id'], 'create_product', 'Tạo sản phẩm ID=' . $newId);
            $product = $this->productModel->findById($newId);
            Response::json([
                "message" => "Tạo sản phẩm thành công",
                "product" => $product
            ], 201);
        }

        Response::json(["message" => "Lỗi server khi tạo sản phẩm"], 500);
    }

    // [PUT] /api/products/{id}
    // UC-17: Sửa sản phẩm
    public function update($id, $data) {
        AuthMiddleware::checkAdmin();

        $id = (int)$id;
        if ($id <= 0) {
            Response::json(["message" => "ID sản phẩm không hợp lệ"], 400);
        }

        $product = $this->productModel->findById($id);
        if (!$product) {
            Response::json(["message" => "Sản phẩm không tồn tại"], 404);
        }

        $categoryId = isset($data['category_id']) ? (int)$data['category_id'] : (int)$product['category_id'];
        $name = isset($data['product_name']) ? trim($data['product_name']) : $product['product_name'];
        $barcode = isset($data['barcode']) ? trim($data['barcode']) : $product['barcode'];
        $importPrice = isset($data['import_price']) ? (float)$data['import_price'] : (float)$product['import_price'];
        $sellingPrice = isset($data['selling_price']) ? (float)$data['selling_price'] : (float)$product['selling_price'];
        $stockQuantity = isset($data['stock_quantity']) ? (int)$data['stock_quantity'] : (int)$product['stock_quantity'];

        if ($categoryId <= 0 || $name === '' || $barcode === '' || $importPrice < 0 || $sellingPrice < 0) {
            Response::json(["message" => "Dữ liệu sản phẩm không hợp lệ"], 400);
        }

        // Kiểm tra giá bán phải >= giá nhập (tránh bán lỗ)
        if ($sellingPrice < $importPrice) {
            Response::json(["message" => "Giá bán phải lớn hơn hoặc bằng giá nhập"], 400);
        }

        // Kiểm tra danh mục tồn tại
        if (!$this->categoryModel->findById($categoryId)) {
            Response::json(["message" => "Danh mục không tồn tại"], 400);
        }

        // Kiểm tra trùng mã vạch (trừ chính nó)
        if ($this->productModel->existsBarcode($barcode, $id)) {
            Response::json(["message" => "Mã vạch đã tồn tại trong hệ thống"], 400);
        }

        // Upload ảnh mới nếu có
        $imagePath = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
            try {
                $imagePath = FileUpload::uploadImage($_FILES['image'], 'products', 'product_');
                // Xóa ảnh cũ nếu upload thành công
                if ($imagePath && !empty($product['image'])) {
                    FileUpload::deleteFile($product['image']);
                }
            } catch (Exception $e) {
                Response::json(["message" => $e->getMessage()], 400);
            }
        }

        if ($this->productModel->update($id, $categoryId, $name, $barcode, $imagePath, $importPrice, $sellingPrice, $stockQuantity)) {
            $this->logModel->createLog($_SESSION['user_id'], 'update_product', 'Cập nhật sản phẩm ID=' . $id);
            $updated = $this->productModel->findById($id);
            Response::json([
                "message" => "Cập nhật sản phẩm thành công",
                "product" => $updated
            ]);
        }

        Response::json(["message" => "Lỗi server khi cập nhật sản phẩm"], 500);
    }

    // [DELETE] /api/products/{id}
    // UC-18: Xóa sản phẩm (chỉ khi chưa có trong đơn hàng)
    public function destroy($id) {
        AuthMiddleware::checkAdmin();

        $id = (int)$id;
        if ($id <= 0) {
            Response::json(["message" => "ID sản phẩm không hợp lệ"], 400);
        }

        $product = $this->productModel->findById($id);
        if (!$product) {
            Response::json(["message" => "Sản phẩm không tồn tại"], 404);
        }

        // Không cho xóa nếu đã xuất hiện trong bất kỳ chi tiết đơn hàng nào
        if ($this->productModel->hasOrderDetails($id)) {
            Response::json([
                "message" => "Không thể xóa sản phẩm vì đã tồn tại trong đơn hàng. Vui lòng ngừng kinh doanh hoặc ẩn sản phẩm."
            ], 400);
        }

        if ($this->productModel->delete($id)) {
            $this->logModel->createLog($_SESSION['user_id'], 'delete_product', 'Xóa sản phẩm ID=' . $id);
            Response::json(["message" => "Xóa sản phẩm thành công"]);
        }

        Response::json(["message" => "Lỗi server khi xóa sản phẩm"], 500);
    }
}

