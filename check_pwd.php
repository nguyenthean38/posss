<?php
$hash = '$2y$10$wE/.71W/W9/1A5R0tH79.OX/K2b4U6C4.0lW1d15Q3wZ//c1rM2I6';
echo password_verify('admin', $hash) ? 'ok' : 'fail';
