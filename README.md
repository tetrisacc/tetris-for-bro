# Game Tetris

Đây là game Tetris tôi đã làm. Hãy thử chơi bằng cách mở file index.html!

## Hướng dẫn chơi
- Phím mũi tên trái/phải: Di chuyển khối sang trái/phải
- Phím mũi tên lên: Xoay khối
- Phím mũi tên xuống: Di chuyển khối xuống nhanh hơn
- Phím Space: Thả khối nhanh xuống đáy

Chúc bạn chơi vui vẻ!

## Cách chạy game

Có hai cách để chạy game:

1. **Cách đơn giản nhất**: Mở file `index.html` trực tiếp trong trình duyệt web.

2. **Sử dụng HTTP server**: Nếu bạn có Python, bạn có thể chạy một HTTP server đơn giản:
   ```
   # Với Python 3
   python -m http.server
   
   # Với Python 2
   python -m SimpleHTTPServer
   ```
   Sau đó truy cập `http://localhost:8000` trong trình duyệt.

## Luật chơi

- Mục tiêu là xếp các khối Tetris để tạo thành các hàng hoàn chỉnh.
- Khi một hàng được hoàn thành, nó sẽ biến mất và bạn sẽ ghi điểm.
- Game kết thúc khi các khối chạm đến đỉnh bảng chơi.

## Điểm số

- 1 hàng: 100 điểm × cấp độ
- 2 hàng: 300 điểm × cấp độ
- 3 hàng: 500 điểm × cấp độ
- 4 hàng (Tetris): 800 điểm × cấp độ

## Cấp độ

Cấp độ tăng lên sau mỗi 10 hàng đã hoàn thành. Khi cấp độ tăng, các khối sẽ rơi nhanh hơn.
