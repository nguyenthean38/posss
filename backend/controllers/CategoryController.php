<?php

class CategoryController {
    private $categoryModel;
    private $logModel;

    public function __construct($db) {
        $this->categoryModel = new Category($db);
        $this->logModel = new Log($db);
    }

    // [POST] /api/categories/search
    public function searchCategories($data) {
        AuthMiddleware::checkAdmin();
        $page = isset($data['Page']) ? max(1, (int)$data['Page']) : (isset($data['page']) ? max(1, (int)$data['page']) : 1);
        $limit = isset($data['PageSize']) ? max(1, (int)$data['PageSize']) : (isset($data['pageSize']) ? max(1, (int)$data['pageSize']) : 20);
        $keyword = isset($data['Keyword']) ? trim($data['Keyword']) : (isset($data['keyword']) ? trim($data['keyword']) : '');
        $result = $this->categoryModel->getList($page, $limit, $keyword);
        $this->logModel->createLog($_SESSION['user_id'], 'search_categories', 'Tìm kiếm danh mục');
        Response::json($result);
    }

    // [GET] /api/categories
    public function index() {
        AuthMiddleware::checkAdmin();

        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 20;
        $keyword = isset($_GET['q']) ? trim($_GET['q']) : '';

        $result = $this->categoryModel->getList($page, $limit, $keyword);

        $this->logModel->createLog($_SESSION['user_id'], 'view_categories', 'Xem danh sách danh mục');

        Response::json($result);
    }

    // [GET] /api/categories/{id}
    public function show($id) {
        AuthMiddleware::checkAdmin();
        $id = (int)$id;
        if ($id <= 0) {
            Response::json(["message" => "ID danh mục không hợp lệ"], 400);
        }

        $category = $this->categoryModel->findById($id);
        if (!$category) {
            Response::json(["message" => "Danh mục không tồn tại"], 404);
        }

        $this->logModel->createLog($_SESSION['user_id'], 'view_category', 'Xem danh mục ID=' . $id);

        Response::json(['category' => $category]);
    }

    // [POST] /api/categories
    public function store($data) {
        AuthMiddleware::checkAdmin();

        $name = isset($data['category_name']) ? trim($data['category_name']) : (isset($data['name']) ? trim($data['name']) : '');
        if ($name === '') {
            Response::json(["message" => "Tên danh mục không được để trống"], 400);
        }

        if ($this->categoryModel->existsByName($name)) {
            Response::json(["message" => "Tên danh mục đã tồn tại"], 400);
        }

        $newId = $this->categoryModel->create($name);
        if ($newId) {
            $this->logModel->createLog($_SESSION['user_id'], 'create_category', 'Tạo danh mục ID=' . $newId);
            $category = $this->categoryModel->findById($newId);
            Response::json([
                "message" => "Tạo danh mục thành công",
                "category" => $category
            ], 201);
        }

        Response::json(["message" => "Lỗi server khi tạo danh mục"], 500);
    }

    // [PUT] /api/categories/{id}
    public function update($id, $data) {
        AuthMiddleware::checkAdmin();

        $id = (int)$id;
        if ($id <= 0) {
            Response::json(["message" => "ID danh mục không hợp lệ"], 400);
        }

        $name = isset($data['category_name']) ? trim($data['category_name']) : (isset($data['name']) ? trim($data['name']) : '');
        if ($name === '') {
            Response::json(["message" => "Tên danh mục không được để trống"], 400);
        }

        $category = $this->categoryModel->findById($id);
        if (!$category) {
            Response::json(["message" => "Danh mục không tồn tại"], 404);
        }

        if ($this->categoryModel->existsByName($name, $id)) {
            Response::json(["message" => "Tên danh mục đã tồn tại"], 400);
        }

        if ($this->categoryModel->update($id, $name)) {
            $this->logModel->createLog($_SESSION['user_id'], 'update_category', 'Cập nhật danh mục ID=' . $id);
            $updated = $this->categoryModel->findById($id);
            Response::json([
                "message" => "Cập nhật danh mục thành công",
                "category" => $updated
            ]);
        }

        Response::json(["message" => "Lỗi server khi cập nhật danh mục"], 500);
    }

    // [DELETE] /api/categories/{id}
    public function destroy($id) {
        AuthMiddleware::checkAdmin();

        $id = (int)$id;
        if ($id <= 0) {
            Response::json(["message" => "ID danh mục không hợp lệ"], 400);
        }

        $category = $this->categoryModel->findById($id);
        if (!$category) {
            Response::json(["message" => "Danh mục không tồn tại"], 404);
        }

        // Không cho xóa nếu còn sản phẩm thuộc danh mục
        if ($this->categoryModel->hasProducts($id)) {
            Response::json(["message" => "Không thể xóa danh mục vì vẫn còn sản phẩm thuộc danh mục này"], 400);
        }

        if ($this->categoryModel->delete($id)) {
            $this->logModel->createLog($_SESSION['user_id'], 'delete_category', 'Xóa danh mục ID=' . $id);
            Response::json(["message" => "Xóa danh mục thành công"]);
        }

        Response::json(["message" => "Lỗi server khi xóa danh mục"], 500);
    }
}

