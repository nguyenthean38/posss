#!/bin/bash

echo "========================================"
echo "Updating HTML files to use new JS modules"
echo "========================================"
echo ""

# Backup old JS files
echo "[1/3] Backing up old JS files..."
mkdir -p assets/js/old
mv assets/js/products.js assets/js/old/ 2>/dev/null || true
mv assets/js/categories.js assets/js/old/ 2>/dev/null || true
mv assets/js/customers.js assets/js/old/ 2>/dev/null || true
mv assets/js/reports.js assets/js/old/ 2>/dev/null || true
mv assets/js/profile.js assets/js/old/ 2>/dev/null || true
mv assets/js/dashboard.js assets/js/old/ 2>/dev/null || true
echo "Done!"
echo ""

# Rename new files
echo "[2/3] Renaming new JS files..."
mv assets/js/products-new.js assets/js/products.js
mv assets/js/categories-new.js assets/js/categories.js
mv assets/js/customers-new.js assets/js/customers.js
mv assets/js/reports-new.js assets/js/reports.js
mv assets/js/profile-new.js assets/js/profile.js
mv assets/js/dashboard-new.js assets/js/dashboard.js
echo "Done!"
echo ""

# Update HTML files to use type="module"
echo "[3/3] Updating HTML files..."

# products.html
sed -i 's|<script src="assets/js/products.js"></script>|<script type="module" src="assets/js/products.js"></script>|g' products.html

# categories.html
sed -i 's|<script src="assets/js/categories.js"></script>|<script type="module" src="assets/js/categories.js"></script>|g' categories.html

# customers.html
sed -i 's|<script src="assets/js/customers.js"></script>|<script type="module" src="assets/js/customers.js"></script>|g' customers.html

# reports.html
sed -i 's|<script src="assets/js/reports.js"></script>|<script type="module" src="assets/js/reports.js"></script>|g' reports.html

# profile.html
sed -i 's|<script src="assets/js/profile.js"></script>|<script type="module" src="assets/js/profile.js"></script>|g' profile.html

# dashboard.html
sed -i 's|<script src="assets/js/dashboard.js"></script>|<script type="module" src="assets/js/dashboard.js"></script>|g' dashboard.html

echo "Done!"
echo ""

echo "========================================"
echo "Update Complete!"
echo "========================================"
echo ""
echo "Old JS files backed up to: assets/js/old/"
echo "All HTML files now use ES6 modules"
echo ""
echo "You can now test the application!"
echo ""
