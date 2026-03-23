<?php

class CustomerController {
    private $customerModel;
    private $logModel;

    public function __construct($db) {
        $this->customerModel = new Customer($db);
        $this->logModel = new Log($db);
    }

    // [POST] /api/customers
    // UC-21: Tạo khách hàng mới khi thanh toán lần đầu
    public function store($data) {
        AuthMiddleware::checkAuth();

        // Chuẩn hóa: chỉ chấp nhận snake_case (theo database schema)
        $fullName = isset($data['full_name']) ? trim($data['full_name']) : '';
        $phone = isset($data['phone_number']) ? trim($data['phone_number']) : '';
        $address = isset($data['address']) ? trim($data['address']) : null;

        if ($fullName === '' || $phone === '') {
            Response::json(["message" => "Họ tên và SĐT không được để trống"], 400);
        }

        // Kiểm tra trùng SĐT
        if ($this->customerModel->existsByPhone($phone)) {
            Response::json(["message" => "Số điện thoại đã tồn tại trong hệ thống"], 400);
        }

        // Upload avatar (TÙY CHỌN - nếu không có sẽ dùng ảnh mặc định)
        $avatarPath = null;
        if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE) {
            try {
                $avatarPath = FileUpload::uploadImage($_FILES['avatar'], 'customers', 'customer_');
            } catch (Exception $e) {
                Response::json(["message" => $e->getMessage()], 400);
            }
        }

        $newId = $this->customerModel->create($fullName, $phone, $address, $avatarPath);
        if ($newId) {
            $customer = $this->customerModel->findById($newId);
            $this->logModel->createLog(
                $_SESSION['user_id'],
                'create_customer',
                'Tạo khách hàng ID=' . $newId . ' SĐT=' . $phone
            );

            Response::json([
                "message" => "Tạo khách hàng thành công",
                "customer" => $customer
            ], 201);
        }

        Response::json(["message" => "Lỗi server khi tạo khách hàng"], 500);
    }

    // [GET] /api/customers
    public function index() {
        AuthMiddleware::checkAuth();
        
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 20;
        $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
        
        $result = $this->customerModel->getList($page, $limit, $keyword);
        Response::json($result);
    }

    // [PUT] /api/customers/{id}
    public function update($id, $data) {
        AuthMiddleware::checkAuth();
        $id = (int)$id;
        
        $customer = $this->customerModel->findById($id);
        if (!$customer) {
            Response::json(["message" => "Khách hàng không tồn tại"], 404);
        }

        // Chuẩn hóa: chỉ chấp nhận snake_case (theo database schema)
        $fullName = isset($data['full_name']) ? trim($data['full_name']) : '';
        $phone = isset($data['phone_number']) ? trim($data['phone_number']) : '';
        $address = isset($data['address']) ? trim($data['address']) : null;

        if ($fullName === '' || $phone === '') {
            Response::json(["message" => "Họ tên và SĐT không được để trống"], 400);
        }

        if ($this->customerModel->existsByPhone($phone, $id)) {
            Response::json(["message" => "Số điện thoại đã tồn tại"], 400);
        }

        // Upload avatar mới nếu có (TÙY CHỌN)
        $avatarPath = null;
        if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE) {
            try {
                $avatarPath = FileUpload::uploadImage($_FILES['avatar'], 'customers', 'customer_');
                // Xóa avatar cũ nếu upload thành công và không phải ảnh mặc định
                if ($avatarPath && !empty($customer['avatar']) && $customer['avatar'] !== 'uploads/customers/default-customer.png') {
                    FileUpload::deleteFile($customer['avatar']);
                }
            } catch (Exception $e) {
                Response::json(["message" => $e->getMessage()], 400);
            }
        }

        if ($this->customerModel->update($id, $fullName, $phone, $address, $avatarPath)) {
            $this->logModel->createLog($_SESSION['user_id'], 'update_customer', 'Cập nhật khách hàng ID=' . $id);
            Response::json(["message" => "Cập nhật thành công"]);
        }
        Response::json(["message" => "Lỗi server"], 500);
    }

    // [DELETE] /api/customers/{id}
    public function destroy($id) {
        AuthMiddleware::checkAuth();
        $id = (int)$id;
        try {
            if ($this->customerModel->delete($id)) {
                $this->logModel->createLog($_SESSION['user_id'], 'delete_customer', 'Xóa khách hàng ID=' . $id);
                Response::json(["message" => "Xóa thành công"]);
            } else {
                Response::json(["message" => "Không thể xóa"], 400);
            }
        } catch(Exception $e) {
            Response::json(["message" => "Không thể xóa khách hàng đã có lịch sử đổi trả/mua hàng"], 400);
        }
    }

    // [GET] /api/customers/{id}
    // UC-22: Xem thông tin khách hàng + tổng quan mua hàng
    public function show($customerId) {
        AuthMiddleware::checkAuth();

        $customerId = (int)$customerId;
        if ($customerId <= 0) {
            Response::json(["message" => "ID khách hàng không hợp lệ"], 400);
        }

        $customer = $this->customerModel->findById($customerId);
        if (!$customer) {
            Response::json(["message" => "Khách hàng không tồn tại"], 404);
        }

        $overview = $this->customerModel->getPurchaseOverview($customerId, 10);

        $this->logModel->createLog(
            $_SESSION['user_id'],
            'view_customer',
            'Xem hồ sơ khách hàng ID=' . $customerId
        );

        Response::json([
            'customer' => $customer,
            'purchase_overview' => $overview,
        ]);
    }

    // [GET] /api/customers/search-by-phone?phone=...
    // UC-20: Tra cứu khách hàng theo SĐT
    public function searchByPhone() {
        AuthMiddleware::checkAuth();

        $phone = isset($_GET['phone']) ? trim($_GET['phone']) : '';
        if ($phone === '') {
            Response::json(["message" => "Vui lòng nhập số điện thoại"], 400);
        }

        $customer = $this->customerModel->findByPhone($phone);
        if ($customer) {
            $this->logModel->createLog(
                $_SESSION['user_id'],
                'lookup_customer_phone',
                'Tra cứu khách hàng SĐT=' . $phone . ' (ID=' . $customer['id'] . ')'
            );

            Response::json([
                "customer" => $customer
            ]);
        } else {
            $this->logModel->createLog(
                $_SESSION['user_id'],
                'lookup_customer_phone_not_found',
                'Tra cứu khách hàng SĐT=' . $phone . ' nhưng không tìm thấy'
            );

            Response::json([
                "message" => "Khách hàng không tồn tại"
            ], 404);
        }
    }

    // [GET] /api/customers/{id}/history
    public function history($id) {
        AuthMiddleware::checkAuth();
        $id = (int)$id;
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['pageSize']) ? max(1, (int)$_GET['pageSize']) : 20;

        $history = $this->customerModel->getPurchaseHistory($id, $page, $limit);
        $this->logModel->createLog($_SESSION['user_id'], 'view_customer_history', 'Xem lịch sử mua hàng khách hàng ID=' . $id);
        Response::json($history);
    }

    // [GET] /api/customers/orders/{orderId}
    public function orderDetail($orderId) {
        AuthMiddleware::checkAuth();
        $orderId = (int)$orderId;
        $detail = $this->customerModel->getOrderDetail($orderId);
        
        if (!$detail) {
            Response::json(["message" => "Không tìm thấy đơn hàng"], 404);
        }

        $this->logModel->createLog($_SESSION['user_id'], 'view_order_detail', 'Xem chi tiết đơn hàng ID=' . $orderId);
        Response::json($detail);
    }
}

