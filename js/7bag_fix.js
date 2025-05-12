/**
 * Hệ thống 7-bag randomizer chuẩn cho Tetris
 * Mỗi túi chứa đúng 7 khối Tetris khác nhau (I, J, L, O, S, T, Z)
 * được xáo trộn ngẫu nhiên
 */

// Khai báo biến bên ngoài để ngăn xung đột
window.tetrisFix = {
    // Túi hiện tại chứa các khối
    currentBag: [],
    // Túi dự phòng để chuẩn bị sẵn
    preparedBags: [],
    // Số lượng túi dự phòng cần có sẵn
    READY_BAGS: 2
};

// Lấy tên khối để hiển thị trong console
window.tetrisFix.getPieceName = function(index) {
    const pieceNames = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    return pieceNames[index];
};

// Tạo một túi mới chứa 7 khối xáo trộn ngẫu nhiên
window.tetrisFix.generateNewBag = function() {
    // Tạo mảng các chỉ số khối (0-6 tương ứng với I, J, L, O, S, T, Z)
    const indices = [0, 1, 2, 3, 4, 5, 6];
    
    // Xáo trộn mảng theo thuật toán Fisher-Yates
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // Kiểm tra tính hợp lệ của bag - đảm bảo có đủ 7 khối khác nhau
    const uniquePieces = new Set(indices);
    if (uniquePieces.size !== 7) {
        console.error("Lỗi: Túi không hợp lệ - không đủ 7 khối khác nhau");
        // Nếu xảy ra lỗi, tạo túi mới với 7 khối khác nhau
        return window.tetrisFix.generateNewBag();
    }
    
    console.log("Tạo túi mới: " + indices.map(window.tetrisFix.getPieceName).join(", "));
    return indices;
};

// Khởi tạo hệ thống túi
window.tetrisFix.initBagSystem = function() {
    // Xóa các túi cũ nếu có
    window.tetrisFix.preparedBags = [];
    
    // Tạo túi đầu tiên
    window.tetrisFix.currentBag = window.tetrisFix.generateNewBag();
    
    // Tạo túi dự phòng
    for (let i = 0; i < window.tetrisFix.READY_BAGS; i++) {
        const newBag = window.tetrisFix.generateNewBag();
        window.tetrisFix.preparedBags.push(newBag);
        console.log(`Túi dự phòng #${i+1}: ${newBag.map(window.tetrisFix.getPieceName).join(', ')}`);
    }
    
    console.log("Túi hiện tại: " + window.tetrisFix.currentBag.map(window.tetrisFix.getPieceName).join(", "));
    console.log("Hệ thống túi đã được khởi tạo thành công");
};

// Lấy chỉ số khối tiếp theo từ túi 7-bag
window.tetrisFix.getNextPieceFromBag = function() {
    // Nếu túi hiện tại rỗng, lấy túi tiếp theo
    if (window.tetrisFix.currentBag.length === 0) {
        // Lấy túi dự phòng đầu tiên
        window.tetrisFix.currentBag = window.tetrisFix.preparedBags.shift();
        
        // Tạo túi mới và thêm vào danh sách dự phòng
        const newBag = window.tetrisFix.generateNewBag();
        window.tetrisFix.preparedBags.push(newBag);
        
        console.log("Đã dùng hết túi hiện tại.");
        console.log("Túi mới: " + window.tetrisFix.currentBag.map(window.tetrisFix.getPieceName).join(", "));
    }
    
    // Lấy khối tiếp theo từ cuối túi
    let nextPiece = window.tetrisFix.currentBag.pop();
    console.log(`Khối tiếp theo: ${window.tetrisFix.getPieceName(nextPiece)}`);
    
    return nextPiece;
};

// Ghi đè các hàm trong tetris.js
window.addEventListener('DOMContentLoaded', function() {
    console.log("Áp dụng bản vá hệ thống 7-bag randomizer chuẩn...");
    
    // Ghi đè các hàm
    window.initBagSystem = window.tetrisFix.initBagSystem;
    window.getNextPieceFromBag = window.tetrisFix.getNextPieceFromBag;
    window.getPieceName = window.tetrisFix.getPieceName;
    
    // Theo dõi và xử lý restart game
    setTimeout(function() {
        // Ghi đè thêm hàm resetGame
        const originalResetGame = window.resetGame;
        if (originalResetGame) {
            window.resetGame = function() {
                console.log("Hook resetGame được gọi, khởi tạo lại hệ thống 7-bag...");
                
                // Gọi hàm gốc
                originalResetGame();
            };
        }
        
        // Lắng nghe sự kiện khi người dùng nhấn nút Restart
        const startButton = document.getElementById('start-button');
        if (startButton) {
            startButton.addEventListener('dblclick', function() {
                console.log("Người dùng nhấn double-click nút Start, khởi tạo lại hệ thống 7-bag...");
                window.initBagSystem();
            });
        }
        
        // Khởi động lại hệ thống bag để áp dụng các thay đổi
        if (window.initBagSystem) {
            console.log("Khởi động lại hệ thống 7-bag randomizer...");
            window.initBagSystem();
        }
    }, 1000); // Đợi 1 giây để đảm bảo game đã tải xong
}); 