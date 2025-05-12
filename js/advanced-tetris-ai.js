/**
 * Advanced Tetris AI
 * Thuật toán AI thông minh hơn cho trò chơi Tetris
 */

(function() {
    // Đảm bảo document đã tải xong
    function initialize() {
        console.log("Khởi tạo AI nâng cao cho Tetris...");
        
        // Khai báo các tham số và trọng số cho AI
        const weights = {
            heightWeight: -0.510066,
            linesWeight: 0.760666,
            holesWeight: -0.35663,
            bumpinessWeight: -0.184483,
            wellsWeight: -0.3,
            clearedLinesWeight: 0.8,
            blockadeWeight: -0.5,
            heightDifferenceWeight: -0.3,
            isWellFormedWeight: 0.6,
            pitDepthWeight: -0.4
        };
        
        // Các hằng số cho AI
        const MAX_HEIGHT_THRESHOLD = 15; // Ngưỡng chiều cao tối đa cho phép
        const PANIC_MODE_THRESHOLD = 16;  // Chiều cao kích hoạt chế độ hoảng loạn
        const WELL_BUILDING_COLUMN = 0;   // Cột để xây dựng giếng đổ (thường là 0 hoặc 9)
        
        // Cờ chế độ thông minh
        let smartMode = true;
        
        // -------------------- Hàm hỗ trợ --------------------
        
        // Lấy tham chiếu đến các biến trong trò chơi
        function getGameVariables() {
            // Kiểm tra xem game có đang chạy
            if (typeof window.isGameOver !== 'undefined' && window.isGameOver) return null;
            if (typeof window.isPaused !== 'undefined' && window.isPaused) return null;
            
            try {
                // Biến khối hiện tại
                const currentPiece = window.currentPiece || null;
                // Biến bảng
                const board = typeof window.BOARD !== 'undefined' ? window.BOARD : null;
                // Kích thước bảng
                const boardWidth = typeof window.BOARD_WIDTH !== 'undefined' ? window.BOARD_WIDTH : 10;
                const boardHeight = typeof window.BOARD_HEIGHT !== 'undefined' ? window.BOARD_HEIGHT : 20;
                
                return {
                    currentPiece, 
                    board, 
                    boardWidth, 
                    boardHeight,
                    isValid: (currentPiece !== null && board !== null)
                };
            } catch (e) {
                console.error("Lỗi khi lấy biến game:", e);
                return null;
            }
        }
        
        // Clone ma trận
        function cloneMatrix(matrix) {
            return matrix.map(row => [...row]);
        }
        
        // Clone bảng
        function cloneBoard(board) {
            return board.map(row => [...row]);
        }
        
        // Đánh giá bảng (đầu tiên)
        function evaluateBoard(board, clearedLines, boardWidth, boardHeight) {
            // Tính toán các đặc điểm của bảng
            const { 
                aggregateHeight, 
                completedLines, 
                holes, 
                bumpiness, 
                wells,
                maxHeight,
                pitDepth,
                isWellFormed
            } = calculateBoardFeatures(board, boardWidth, boardHeight);
            
            // Dựa vào độ cao tối đa để điều chỉnh trọng số
            let adjustedWeights = {...weights};
            
            // Nếu độ cao quá lớn, ưu tiên giảm độ cao và loại bỏ lỗ
            if (maxHeight > PANIC_MODE_THRESHOLD) {
                adjustedWeights.heightWeight *= 1.5;
                adjustedWeights.holesWeight *= 1.5;
                adjustedWeights.clearedLinesWeight *= 2;
            }
            
            // Tính điểm đánh giá
            let score = 
                adjustedWeights.heightWeight * aggregateHeight +
                adjustedWeights.linesWeight * completedLines +
                adjustedWeights.holesWeight * holes +
                adjustedWeights.bumpinessWeight * bumpiness +
                adjustedWeights.wellsWeight * wells +
                adjustedWeights.clearedLinesWeight * clearedLines +
                adjustedWeights.pitDepthWeight * pitDepth;
                
            // Cộng thêm điểm cho giếng hình thành tốt
            if (isWellFormed) {
                score += adjustedWeights.isWellFormedWeight;
            }
            
            return score;
        }
        
        // Tính toán các đặc điểm của bảng
        function calculateBoardFeatures(board, boardWidth, boardHeight) {
            // Mảng độ cao của từng cột
            const heights = Array(boardWidth).fill(0);
            
            // Tính độ cao từng cột
            for (let col = 0; col < boardWidth; col++) {
                for (let row = 0; row < boardHeight; row++) {
                    if (board[row][col]) {
                        heights[col] = boardHeight - row;
                        break;
                    }
                }
            }
            
            // Tính tổng độ cao
            const aggregateHeight = heights.reduce((sum, height) => sum + height, 0);
            
            // Tính độ cao tối đa
            const maxHeight = Math.max(...heights);
            
            // Đếm số lỗ (ô trống bên dưới ô có khối)
            let holes = 0;
            for (let col = 0; col < boardWidth; col++) {
                let block = false;
                for (let row = 0; row < boardHeight; row++) {
                    if (board[row][col]) {
                        block = true;
                    } else if (block) {
                        holes++;
                    }
                }
            }
            
            // Tính độ gồ ghề (khác biệt độ cao giữa các cột liền kề)
            let bumpiness = 0;
            for (let col = 0; col < boardWidth - 1; col++) {
                bumpiness += Math.abs(heights[col] - heights[col + 1]);
            }
            
            // Đếm số dòng đã hoàn thành
            let completedLines = 0;
            for (let row = 0; row < boardHeight; row++) {
                if (board[row].every(cell => cell !== 0)) {
                    completedLines++;
                }
            }
            
            // Tính giếng (ô trống có 2 bên là khối)
            let wells = 0;
            for (let col = 0; col < boardWidth; col++) {
                for (let row = 0; row < boardHeight; row++) {
                    if (!board[row][col]) {
                        let leftFilled = col > 0 ? board[row][col - 1] : true;
                        let rightFilled = col < boardWidth - 1 ? board[row][col + 1] : true;
                        
                        if (leftFilled && rightFilled) {
                            wells++;
                        }
                    }
                }
            }
            
            // Tính độ sâu của hố (pit)
            let pitDepth = 0;
            for (let col = 0; col < boardWidth; col++) {
                let currentDepth = 0;
                let foundBlock = false;
                
                for (let row = boardHeight - 1; row >= 0; row--) {
                    if (board[row][col]) {
                        foundBlock = true;
                    } else if (foundBlock) {
                        currentDepth++;
                    }
                }
                
                pitDepth += currentDepth;
            }
            
            // Kiểm tra xem giếng có được hình thành tốt không
            let isWellFormed = false;
            const wellColumn = WELL_BUILDING_COLUMN;
            
            if (heights[wellColumn] < maxHeight - 2) {
                const adjacentCol = wellColumn === 0 ? 1 : wellColumn - 1;
                if (heights[adjacentCol] >= heights[wellColumn] + 3) {
                    isWellFormed = true;
                }
            }
            
            return {
                aggregateHeight,
                completedLines,
                holes,
                bumpiness,
                wells,
                maxHeight,
                pitDepth,
                isWellFormed
            };
        }
        
        // Tìm tất cả các vị trí có thể đặt khối
        function findAllPossiblePlacements(currentPiece, board, boardWidth, boardHeight) {
            const allPlacements = [];
            
            if (!currentPiece || !currentPiece.shape) {
                console.error("Thiếu thông tin về khối hiện tại");
                return allPlacements;
            }
            
            // Lặp qua tất cả các hướng xoay
            for (let rotation = 0; rotation < 4; rotation++) {
                // Clone khối và xoay nó
                const clonedPiece = {...currentPiece};
                clonedPiece.shape = cloneMatrix(currentPiece.shape);
                
                // Xoay khối
                for (let r = 0; r < rotation; r++) {
                    clonedPiece.shape = rotateMatrix(clonedPiece.shape);
                }
                
                const pieceWidth = clonedPiece.shape[0].length;
                
                // Di chuyển khối sang phải và trái
                for (let x = -2; x < boardWidth; x++) {
                    // Clone khối để thử nghiệm
                    const testPiece = {...clonedPiece};
                    testPiece.x = x;
                    testPiece.y = 0;
                    
                    // Thả rơi khối
                    while (!checkCollision(testPiece, board, boardWidth, boardHeight)) {
                        testPiece.y++;
                    }
                    testPiece.y--; // Quay lại vị trí cuối cùng trước khi va chạm
                    
                    // Nếu khối có phần nằm ngoài bảng, bỏ qua
                    if (testPiece.x < 0 || testPiece.x + pieceWidth > boardWidth || testPiece.y < 0) {
                        continue;
                    }
                    
                    // Tạo bảng mới với khối đặt ở vị trí này
                    const newBoard = cloneBoard(board);
                    let clearedLines = 0;
                    
                    // Đặt khối vào bảng
                    const placementValid = placePiece(testPiece, newBoard, boardWidth, boardHeight);
                    
                    if (placementValid) {
                        // Xóa các dòng đã hoàn thành
                        clearedLines = clearLines(newBoard, boardWidth, boardHeight);
                        
                        // Đánh giá bảng mới
                        const score = evaluateBoard(newBoard, clearedLines, boardWidth, boardHeight);
                        
                        // Thêm vào danh sách tất cả các vị trí có thể
                        allPlacements.push({
                            x: testPiece.x,
                            y: testPiece.y,
                            rotation: rotation,
                            score: score,
                            board: newBoard,
                            clearedLines: clearedLines
                        });
                    }
                }
            }
            
            return allPlacements;
        }
        
        // Kiểm tra va chạm
        function checkCollision(piece, board, boardWidth, boardHeight) {
            const shape = piece.shape;
            const pieceX = piece.x;
            const pieceY = piece.y;
            
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        const boardX = pieceX + x;
                        const boardY = pieceY + y;
                        
                        // Kiểm tra va chạm với biên
                        if (boardX < 0 || boardX >= boardWidth || boardY >= boardHeight) {
                            return true;
                        }
                        
                        // Kiểm tra va chạm với khối khác trên bảng
                        if (boardY >= 0 && board[boardY][boardX]) {
                            return true;
                        }
                    }
                }
            }
            
            return false;
        }
        
        // Đặt khối vào bảng
        function placePiece(piece, board, boardWidth, boardHeight) {
            const shape = piece.shape;
            const pieceX = piece.x;
            const pieceY = piece.y;
            
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        const boardX = pieceX + x;
                        const boardY = pieceY + y;
                        
                        // Kiểm tra nếu vị trí nằm ngoài bảng
                        if (boardX < 0 || boardX >= boardWidth || boardY < 0 || boardY >= boardHeight) {
                            return false;
                        }
                        
                        // Đặt khối vào bảng
                        board[boardY][boardX] = piece.color || 1;
                    }
                }
            }
            
            return true;
        }
        
        // Xóa các dòng đã hoàn thành
        function clearLines(board, boardWidth, boardHeight) {
            let linesCleared = 0;
            
            for (let y = boardHeight - 1; y >= 0; y--) {
                // Kiểm tra xem dòng có đầy không
                const rowFilled = board[y].every(cell => cell !== 0);
                
                if (rowFilled) {
                    linesCleared++;
                    
                    // Di chuyển tất cả các dòng phía trên xuống
                    for (let moveY = y; moveY > 0; moveY--) {
                        for (let x = 0; x < boardWidth; x++) {
                            board[moveY][x] = board[moveY - 1][x];
                        }
                    }
                    
                    // Xóa dòng trên cùng
                    board[0].fill(0);
                    
                    // Kiểm tra lại dòng hiện tại
                    y++;
                }
            }
            
            return linesCleared;
        }
        
        // Xoay ma trận
        function rotateMatrix(matrix) {
            const N = matrix.length;
            const result = Array(N).fill().map(() => Array(N).fill(0));
            
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    result[j][N - 1 - i] = matrix[i][j];
                }
            }
            
            return result;
        }
        
        // Tìm vị trí tốt nhất để đặt khối
        function findBestPlacement() {
            const gameVars = getGameVariables();
            if (!gameVars || !gameVars.isValid) return null;
            
            const { currentPiece, board, boardWidth, boardHeight } = gameVars;
            
            // Tìm tất cả các vị trí có thể
            const allPlacements = findAllPossiblePlacements(currentPiece, board, boardWidth, boardHeight);
            
            if (allPlacements.length === 0) {
                console.log("Không tìm thấy vị trí nào khả thi");
                return null;
            }
            
            // Sắp xếp theo điểm số giảm dần
            allPlacements.sort((a, b) => b.score - a.score);
            
            // Trả về vị trí tốt nhất
            return allPlacements[0];
        }
        
        // Di chuyển khối đến vị trí tốt nhất
        function movePieceToTarget(targetPosition) {
            if (!targetPosition) return false;
            
            const gameVars = getGameVariables();
            if (!gameVars || !gameVars.isValid) return false;
            
            const { currentPiece } = gameVars;
            
            try {
                // Đầu tiên xoay khối
                const currentRotation = getCurrentRotation(currentPiece);
                const targetRotation = targetPosition.rotation;
                
                const rotationDiff = (targetRotation - currentRotation + 4) % 4;
                
                // Thực hiện xoay
                for (let i = 0; i < rotationDiff; i++) {
                    window.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'ArrowUp' }));
                }
                
                // Di chuyển sang trái hoặc phải
                const moveDirection = targetPosition.x > currentPiece.x ? 'ArrowRight' : 'ArrowLeft';
                const moveSteps = Math.abs(targetPosition.x - currentPiece.x);
                
                for (let i = 0; i < moveSteps; i++) {
                    window.dispatchEvent(new KeyboardEvent('keydown', { 'key': moveDirection }));
                }
                
                // Thả rơi nhanh
                window.dispatchEvent(new KeyboardEvent('keydown', { 'key': ' ' }));
                
                return true;
            } catch (e) {
                console.error("Lỗi khi di chuyển khối:", e);
                return false;
            }
        }
        
        // Lấy hướng xoay hiện tại của khối
        function getCurrentRotation(piece) {
            // Đây chỉ là ước lượng đơn giản, có thể cần điều chỉnh
            // dựa trên cách mà trò chơi của bạn theo dõi xoay
            return 0; // Giả định khối mới luôn có hướng xoay ban đầu là 0
        }
        
        // Hàm tự động chơi thông minh
        window.superSmartPlay = function() {
            if (!smartMode) return false;
            
            const gameVars = getGameVariables();
            if (!gameVars || !gameVars.isValid) return false;
            
            try {
                // Tìm vị trí tốt nhất
                const bestPlacement = findBestPlacement();
                
                // Di chuyển khối đến vị trí đó
                return movePieceToTarget(bestPlacement);
            } catch (e) {
                console.error("Lỗi khi tự động chơi:", e);
                return false;
            }
        };
        
        // Thêm nút để chuyển đổi giữa AI thông minh và AI thông thường
        function addSmartAIToggle() {
            // Kiểm tra nếu nút đã tồn tại
            if (document.getElementById('smart-ai-toggle-button')) return;
            
            const container = document.createElement('div');
            container.id = 'smart-ai-toggle-container';
            container.style.position = 'fixed';
            container.style.right = '20px';
            container.style.bottom = '20px';
            container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            container.style.padding = '10px';
            container.style.borderRadius = '10px';
            container.style.zIndex = '10000';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.style.gap = '10px';
            container.style.border = '2px solid #00ffff';
            container.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
            
            const title = document.createElement('div');
            title.textContent = 'THÔNG MINH';
            title.style.color = '#00ffff';
            title.style.fontSize = '14px';
            title.style.fontWeight = 'bold';
            
            const button = document.createElement('div');
            button.id = 'smart-ai-toggle-button';
            button.innerHTML = '🧠';
            button.style.width = '50px';
            button.style.height = '50px';
            button.style.borderRadius = '50%';
            button.style.backgroundColor = '#00ffff';
            button.style.color = '#000';
            button.style.fontSize = '24px';
            button.style.display = 'flex';
            button.style.justifyContent = 'center';
            button.style.alignItems = 'center';
            button.style.cursor = 'pointer';
            button.style.boxShadow = '0 0 10px #00ffff';
            
            const status = document.createElement('div');
            status.id = 'smart-ai-status';
            status.textContent = 'BẬT';
            status.style.color = '#44ff44';
            status.style.fontSize = '12px';
            status.style.fontWeight = 'bold';
            
            container.appendChild(title);
            container.appendChild(button);
            container.appendChild(status);
            
            document.body.appendChild(container);
            
            // Xử lý sự kiện khi nhấp vào nút
            button.addEventListener('click', function() {
                smartMode = !smartMode;
                
                if (smartMode) {
                    button.style.backgroundColor = '#00ffff';
                    button.style.color = '#000';
                    button.style.boxShadow = '0 0 10px #00ffff';
                    status.textContent = 'BẬT';
                    status.style.color = '#44ff44';
                } else {
                    button.style.backgroundColor = '#333';
                    button.style.color = '#00ffff';
                    button.style.boxShadow = 'none';
                    status.textContent = 'TẮT';
                    status.style.color = '#ff4444';
                }
            });
        }
        
        // Thêm kết nối với AI hiện có
        function patchExistingAI() {
            // Kiểm tra xem có nút AI nào đã tồn tại chưa
            const aiButton = document.getElementById('left-auto-play-container') || 
                             document.getElementById('ai-mode-button') ||
                             document.getElementById('autoPlayToggle');
            
            if (aiButton) {
                console.log("Phát hiện nút AI hiện có, kết nối với AI thông minh...");
                
                // Tạo sự kiện click giả để kích hoạt AI
                function clickEvent() {
                    const event = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    
                    aiButton.dispatchEvent(event);
                }
                
                // Thay thế các hàm hiện có
                const originalAutoPlay = window.autoPlay;
                const originalImprovedAutoPlay = window.improvedAutoPlay;
                
                window.autoPlay = function() {
                    if (smartMode) {
                        return window.superSmartPlay();
                    } else if (typeof originalAutoPlay === 'function') {
                        return originalAutoPlay();
                    }
                    return false;
                };
                
                window.improvedAutoPlay = function() {
                    if (smartMode) {
                        return window.superSmartPlay();
                    } else if (typeof originalImprovedAutoPlay === 'function') {
                        return originalImprovedAutoPlay();
                    }
                    return false;
                };
            }
        }
        
        // Khởi tạo AI thông minh
        function initSmartAI() {
            // Thêm nút chuyển đổi AI thông minh
            addSmartAIToggle();
            
            // Kết nối với AI hiện có
            patchExistingAI();
            
            console.log("Đã khởi tạo AI thông minh cho Tetris!");
        }
        
        // Gọi hàm khởi tạo khi trang đã tải xong
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(initSmartAI, 2000);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(initSmartAI, 2000);
            });
        }
    }
    
    // Gọi hàm khởi tạo
    initialize();
})(); 