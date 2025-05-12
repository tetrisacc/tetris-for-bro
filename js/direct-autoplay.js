/**
 * Direct Auto Play cho Tetris
 * Chức năng tự động chơi đơn giản bằng cách mô phỏng phím trực tiếp
 */

(function() {
    // Theo dõi trạng thái
    let isPlaying = false;
    let playInterval = null;
    let pieceDropped = false;
    
    // Tạo các sự kiện phím
    function pressKey(key) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    }
    
    // Quét bảng và tìm vị trí tốt để đặt khối
    function findBestPosition() {
        // Vị trí mặc định là giữa bảng
        return Math.floor(Math.random() * 10); // 0-9
    }
    
    // Đơn giản xử lý mỗi bước di chuyển
    function handleMove() {
        // Kiểm tra nếu game đang tạm dừng
        if (window.isPaused || window.isGameOver) return;
        
        // Bước 1: Xoay khối (tối đa 2 lần)
        if (Math.random() > 0.5) {
            pressKey('ArrowUp');
        }
        
        // Bước 2: Di chuyển sang trái hoặc phải
        const target = findBestPosition();
        const moveRight = Math.random() > 0.5;
        
        // Di chuyển sang trái hoặc phải ngẫu nhiên
        for (let i = 0; i < 5; i++) {
            pressKey(moveRight ? 'ArrowRight' : 'ArrowLeft');
        }
        
        // Bước 3: Thả khối
        setTimeout(() => {
            pressKey(' '); // space để thả rơi nhanh
            pieceDropped = true;
        }, 100);
    }
    
    // Hàm tự động chơi đơn giản
    function simpleAutoPlay() {
        if (!isPlaying) return;
        
        try {
            handleMove();
        } catch (e) {
            console.error("Lỗi khi tự động chơi đơn giản:", e);
        }
    }
    
    // Thêm nút tự động chơi đơn giản
    function addDirectAutoPlayButton() {
        // Kiểm tra xem nút đã tồn tại chưa
        if (document.getElementById('direct-autoplay-button')) return;
        
        const container = document.createElement('div');
        container.id = 'direct-autoplay-container';
        container.style.position = 'fixed';
        container.style.left = '20px';
        container.style.bottom = '20px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        container.style.padding = '10px';
        container.style.borderRadius = '10px';
        container.style.zIndex = '10001';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.gap = '10px';
        container.style.border = '2px solid #ff00ff';
        container.style.boxShadow = '0 0 10px rgba(255, 0, 255, 0.5)';
        
        const title = document.createElement('div');
        title.textContent = 'TỰ ĐỘNG ĐƠN GIẢN';
        title.style.color = '#ff00ff';
        title.style.fontSize = '14px';
        title.style.fontWeight = 'bold';
        
        const button = document.createElement('div');
        button.id = 'direct-autoplay-button';
        button.innerHTML = '⚡';
        button.style.width = '50px';
        button.style.height = '50px';
        button.style.borderRadius = '50%';
        button.style.backgroundColor = '#ff00ff';
        button.style.color = '#000';
        button.style.fontSize = '24px';
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 0 10px #ff00ff';
        
        const status = document.createElement('div');
        status.id = 'direct-autoplay-status';
        status.textContent = 'TẮT';
        status.style.color = '#ff4444';
        status.style.fontSize = '12px';
        status.style.fontWeight = 'bold';
        
        container.appendChild(title);
        container.appendChild(button);
        container.appendChild(status);
        
        document.body.appendChild(container);
        
        // Xử lý sự kiện khi nhấp vào nút
        button.addEventListener('click', function() {
            isPlaying = !isPlaying;
            
            if (isPlaying) {
                button.style.backgroundColor = '#ff00ff';
                button.style.color = '#000';
                button.style.boxShadow = '0 0 10px #ff00ff';
                status.textContent = 'BẬT';
                status.style.color = '#44ff44';
                
                // Đảm bảo game đang chạy
                if (typeof window.isPaused !== 'undefined' && window.isPaused) {
                    const startButton = document.getElementById('start-button');
                    if (startButton) startButton.click();
                }
                
                // Mô phỏng phím R để bắt đầu lại nếu game kết thúc
                if (typeof window.isGameOver !== 'undefined' && window.isGameOver) {
                    pressKey('r');
                }
                
                // Lặp tự động chơi
                clearInterval(playInterval);
                playInterval = setInterval(() => {
                    if (pieceDropped) {
                        pieceDropped = false;
                        // Đợi một chút để khối tiếp theo xuất hiện
                        setTimeout(simpleAutoPlay, 300);
                    } else {
                        simpleAutoPlay();
                    }
                }, 500);
            } else {
                // Dừng tự động chơi
                clearInterval(playInterval);
                button.style.backgroundColor = '#333';
                button.style.color = '#ff00ff';
                button.style.boxShadow = 'none';
                status.textContent = 'TẮT';
                status.style.color = '#ff4444';
            }
        });
    }
    
    // Tạo và thêm nút vào trang
    setTimeout(addDirectAutoPlayButton, 2000);
})(); 