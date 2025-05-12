/**
 * Smart Direct Auto Play cho Tetris
 * Tự động chơi thông minh hơn bằng cách mô phỏng phím trực tiếp
 */

(function() {
    // Biến theo dõi trạng thái
    let isPlaying = false;
    let playInterval = null;
    let pieceDropped = false;
    let moveQueue = [];
    
    // Hàm mô phỏng phím
    function pressKey(key) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    }
    
    // Hàm tạo độ trễ
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Tìm độ cao của mỗi cột
    function getColumnHeights() {
        const board = window.BOARD || [];
        const heights = [];
        
        for (let col = 0; col < 10; col++) {
            let height = 20; // Chiều cao tối đa
            
            for (let row = 0; row < 20; row++) {
                if (board[row] && board[row][col]) {
                    height = row;
                    break;
                }
            }
            
            heights.push(20 - height);
        }
        
        return heights;
    }
    
    // Tìm cột có độ cao thấp nhất
    function findLowestColumn() {
        const heights = getColumnHeights();
        let lowestHeight = Infinity;
        let lowestCol = 4; // Mặc định giữa bảng
        
        for (let col = 0; col < heights.length; col++) {
            if (heights[col] < lowestHeight) {
                lowestHeight = heights[col];
                lowestCol = col;
            }
        }
        
        return lowestCol;
    }
    
    // Tìm một vị trí tốt cho khối hiện tại
    function findGoodPosition() {
        // Kiểm tra khối hiện tại
        const currentPiece = window.currentPiece;
        if (!currentPiece) return 4; // Mặc định giữa bảng
        
        // Tùy thuộc vào loại khối
        const shape = JSON.stringify(currentPiece.shape);
        
        if (shape.includes("1,1,1,1")) {
            // Khối I - đặt ở cột có độ cao trung bình
            const heights = getColumnHeights();
            const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
            let bestCol = 4;
            let minDiff = Infinity;
            
            for (let col = 0; col < heights.length - 3; col++) {
                const colAvg = (heights[col] + heights[col+1] + heights[col+2] + heights[col+3]) / 4;
                const diff = Math.abs(colAvg - avgHeight);
                
                if (diff < minDiff) {
                    minDiff = diff;
                    bestCol = col;
                }
            }
            
            return bestCol;
        } else if (shape.includes("1,1,1") && shape.includes("0,0,1")) {
            // Khối L - ưu tiên đặt ở bên phải
            return 7;
        } else if (shape.includes("1,1,1") && shape.includes("1,0,0")) {
            // Khối J - ưu tiên đặt ở bên trái
            return 0;
        } else if (shape.includes("1,1") && shape.includes("1,1")) {
            // Khối O - đặt ở cột thấp nhất
            return findLowestColumn();
        } else {
            // Các khối khác - tìm vị trí thấp nhất
            return findLowestColumn();
        }
    }
    
    // Xử lý di chuyển thông minh
    async function handleSmartMove() {
        // Kiểm tra nếu game đang tạm dừng
        if (window.isPaused || window.isGameOver) return;
        
        const currentPiece = window.currentPiece;
        if (!currentPiece) return;
        
        try {
            // Bước 1: Xoay khối tùy thuộc vào loại khối
            const shape = JSON.stringify(currentPiece.shape);
            
            // Xoay khối I và Z nằm ngang
            if (shape.includes("1,1,1,1") || shape.includes("1,1,0") && shape.includes("0,1,1")) {
                pressKey('ArrowUp'); // Xoay 1 lần
                await sleep(50);
            }
            
            // Bước 2: Tìm vị trí tốt và di chuyển đến đó
            const targetCol = findGoodPosition();
            const currentCol = currentPiece.x;
            const moveDirection = targetCol > currentCol ? 'ArrowRight' : 'ArrowLeft';
            const moveSteps = Math.abs(targetCol - currentCol);
            
            // Di chuyển sang vị trí mục tiêu
            for (let i = 0; i < moveSteps; i++) {
                pressKey(moveDirection);
                await sleep(30);
            }
            
            // Bước 3: Thả khối
            await sleep(100);
            pressKey(' '); // Space để thả rơi nhanh
            pieceDropped = true;
        } catch (e) {
            console.error("Lỗi khi xử lý di chuyển thông minh:", e);
        }
    }
    
    // Hàm tự động chơi thông minh
    function smartDirectAutoPlay() {
        if (!isPlaying) return;
        
        // Xử lý di chuyển thông minh
        handleSmartMove().then(() => {
            // Đợi khối tiếp theo
            setTimeout(() => {
                pieceDropped = false;
            }, 500);
        });
    }
    
    // Thêm nút tự động chơi thông minh
    function addSmartDirectAutoPlayButton() {
        // Kiểm tra xem nút đã tồn tại chưa
        if (document.getElementById('smart-direct-autoplay-button')) return;
        
        const container = document.createElement('div');
        container.id = 'smart-direct-autoplay-container';
        container.style.position = 'fixed';
        container.style.right = '20px';
        container.style.top = '200px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        container.style.padding = '10px';
        container.style.borderRadius = '10px';
        container.style.zIndex = '10001';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.gap = '10px';
        container.style.border = '2px solid #00ff00';
        container.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.5)';
        
        const title = document.createElement('div');
        title.textContent = 'TỰ ĐỘNG THÔNG MINH';
        title.style.color = '#00ff00';
        title.style.fontSize = '14px';
        title.style.fontWeight = 'bold';
        
        const button = document.createElement('div');
        button.id = 'smart-direct-autoplay-button';
        button.innerHTML = '🎮';
        button.style.width = '50px';
        button.style.height = '50px';
        button.style.borderRadius = '50%';
        button.style.backgroundColor = '#333';
        button.style.color = '#00ff00';
        button.style.fontSize = '24px';
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';
        button.style.cursor = 'pointer';
        button.style.transition = 'all 0.3s';
        
        const status = document.createElement('div');
        status.id = 'smart-direct-autoplay-status';
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
                button.style.backgroundColor = '#00ff00';
                button.style.color = '#000';
                button.style.boxShadow = '0 0 10px #00ff00';
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
                
                // Bắt đầu tự động chơi
                playInterval = setInterval(() => {
                    if (!pieceDropped) {
                        smartDirectAutoPlay();
                    }
                }, 1000);
            } else {
                // Dừng tự động chơi
                clearInterval(playInterval);
                button.style.backgroundColor = '#333';
                button.style.color = '#00ff00';
                button.style.boxShadow = 'none';
                status.textContent = 'TẮT';
                status.style.color = '#ff4444';
            }
        });
    }
    
    // Thêm nút vào trang sau khi trang đã tải
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(addSmartDirectAutoPlayButton, 2000);
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(addSmartDirectAutoPlayButton, 2000);
        });
    }
})(); 