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

exec apache2-foreground
