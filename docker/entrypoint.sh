#!/bin/sh
set -e

# Fix MPM conflict at runtime: ensure only mpm_prefork is loaded
find /etc/apache2/mods-enabled/ -name 'mpm_*.load' -delete 2>/dev/null || true
find /etc/apache2/mods-enabled/ -name 'mpm_*.conf' -delete 2>/dev/null || true
ln -sf /etc/apache2/mods-available/mpm_prefork.load \
       /etc/apache2/mods-enabled/mpm_prefork.load
if [ -f /etc/apache2/mods-available/mpm_prefork.conf ]; then
    ln -sf /etc/apache2/mods-available/mpm_prefork.conf \
           /etc/apache2/mods-enabled/mpm_prefork.conf
fi

echo "[entrypoint] MPM modules after fix:"
ls /etc/apache2/mods-enabled/mpm_*.load 2>/dev/null || echo "none found"

# Seed uploads directory on persistent disk (first boot after mount):
# Render's persistent disk mounts empty over /var/www/html/backend/uploads,
# hiding the default assets baked into the image. Copy them from a backup
# location if the mount is empty / missing default files.
UPLOADS_DIR="/var/www/html/backend/uploads"
SEED_DIR="/var/www/html/backend/uploads_seed"
if [ -d "$SEED_DIR" ]; then
    echo "[entrypoint] Seeding uploads from $SEED_DIR ..."
    mkdir -p "$UPLOADS_DIR/avatars" "$UPLOADS_DIR/customers" "$UPLOADS_DIR/products"
    # Copy every default file that is missing on the disk
    cp -n "$SEED_DIR/avatars/default-staff.svg"      "$UPLOADS_DIR/avatars/default-staff.svg"      2>/dev/null || true
    cp -n "$SEED_DIR/customers/default-customer.svg" "$UPLOADS_DIR/customers/default-customer.svg" 2>/dev/null || true
    # Keep .gitkeep so mkdir is idempotent
    touch "$UPLOADS_DIR/avatars/.gitkeep"   2>/dev/null || true
    touch "$UPLOADS_DIR/customers/.gitkeep" 2>/dev/null || true
    touch "$UPLOADS_DIR/products/.gitkeep"  2>/dev/null || true
    chown -R www-data:www-data "$UPLOADS_DIR" 2>/dev/null || true
    chmod -R 775 "$UPLOADS_DIR" 2>/dev/null || true
    echo "[entrypoint] Uploads seed done."
fi

exec apache2-foreground
