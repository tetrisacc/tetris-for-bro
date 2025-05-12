#!/bin/bash

# Định nghĩa đường dẫn
TETRIS_DIR="/Users/nguyenchiloc/Documents/programming/tetris"

# Di chuyển đến thư mục tetris
cd "$TETRIS_DIR"

# Khởi chạy HTTP server (nếu có Python)
python -m http.server 8000 &
SERVER_PID=$!

# Mở trình duyệt với game
open http://localhost:8000

# Hiển thị thông báo
echo "Tetris đã được khởi chạy tại http://localhost:8000"
echo "Nhấn Ctrl+C để dừng server"

# Xử lý khi nhấn Ctrl+C
trap "kill $SERVER_PID; echo 'Server đã dừng'; exit" INT

# Giữ script chạy
wait 