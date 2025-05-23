document.addEventListener('DOMContentLoaded', () => {
    // Phát hiện trình duyệt Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Khởi tạo các biến và canvas
    const canvas = document.getElementById('tetris-canvas');
    const ctx = canvas.getContext('2d');
    const nextCanvas = document.getElementById('next-canvas');
    const nextCtx = nextCanvas.getContext('2d');
    const startButton = document.getElementById('start-button');
    const scoreElement = document.getElementById('score');
    const linesElement = document.getElementById('lines');
    const levelElement = document.getElementById('level');
    
    // Xuất biến toàn cục cho AI
    window.BOARD_WIDTH = 10;
    window.BOARD_HEIGHT = 20;
    window.BOARD = Array(window.BOARD_HEIGHT).fill().map(() => Array(window.BOARD_WIDTH).fill(0));
    
    // Áp dụng các tùy chỉnh cho Safari nếu cần
    if (isSafari || isIOS) {
        document.body.classList.add('safari');
        console.log("Phát hiện Safari/iOS, áp dụng tùy chỉnh tương thích");
        
        // Sửa lỗi hiển thị canvas trên Safari
        const allCanvases = document.querySelectorAll('canvas');
        allCanvases.forEach(c => {
            const ctx = c.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = false;
                // Đảm bảo không có biến đổi nào bị mất
                ctx.setTransform(1, 0, 0, 1, 0, 0);
            }
        });
    }
    
    // Thêm canvas cho khối bổ sung
    const holdCanvas = document.getElementById('hold-canvas');
    const holdCtx = holdCanvas.getContext('2d');
    const nextCanvas1 = document.getElementById('next-canvas-1');
    const nextCtx1 = nextCanvas1.getContext('2d');
    const nextCanvas2 = document.getElementById('next-canvas-2');
    const nextCtx2 = nextCanvas2.getContext('2d');
    const nextCanvas3 = document.getElementById('next-canvas-3');
    const nextCtx3 = nextCanvas3.getContext('2d');
    const nextCanvas4 = document.getElementById('next-canvas-4');
    const nextCtx4 = nextCanvas4.getContext('2d');
    
    // Điều chỉnh kích thước canvas cho đúng 10x20
    canvas.width = 300; // 10 ô * 30px
    canvas.height = 600; // 20 ô * 30px
    
    // Âm thanh
    const sounds = {};
    const soundNames = ['move', 'rotate', 'drop', 'clear', 'tetris', 'level-up', 'game-over'];
    let soundsEnabled = true; // Bật âm thanh mặc định

    // Hàm tải âm thanh một cách an toàn
    function loadSounds() {
        soundNames.forEach(name => {
            try {
                const sound = new Audio(`sounds/${name}.mp3`);
                sound.addEventListener('canplaythrough', () => {
                    sounds[name] = sound;
                    console.log(`Loaded sound: ${name}`);
                }, { once: true });
                
                sound.addEventListener('error', (e) => {
                    console.log(`Failed to load sound: ${name}`, e);
                    // Tạo một AudioContext trống nếu file âm thanh không tồn tại
                    sounds[name] = {
                        play: () => {},
                        currentTime: 0
                    };
                }, { once: true });
                
                // Preload âm thanh
                sound.load();
            } catch (e) {
                console.log(`Error creating audio for ${name}:`, e);
                // Tạo một AudioContext trống nếu có lỗi
                sounds[name] = {
                    play: () => {},
                    currentTime: 0
                };
            }
        });
        
        // Đánh dấu rằng âm thanh đã được tải
        setTimeout(() => {
            soundsEnabled = true;
        }, 1000);
    }
    
    // Gọi hàm tải âm thanh
    loadSounds();
    
    // Hàm phát âm thanh
    function playSound(soundName) {
        if (!soundsEnabled || !sounds[soundName]) return;
        
        try {
            const sound = sounds[soundName];
            sound.currentTime = 0;
            const playPromise = sound.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.log("Không thể phát âm thanh:", e);
                });
            }
        } catch (e) {
            console.log("Lỗi phát âm thanh:", e);
        }
    }
    
    // Kích thước khối và bảng chơi
    const BLOCK_SIZE = 30;
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    const BOARD = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    
    // Biến game
    let score = 0;
    let lines = 0;
    let level = 1;
    let isGameOver = false;
    let isPaused = true;
    let requestId = null;
    let currentPiece = null;
    let nextPiece = null;
    let heldPiece = null;
    let hasHeldThisTurn = false; // Biến để theo dõi việc đã hold trong lượt này chưa
    
    // Biến theo dõi combo
    let comboCount = 0;
    let lastClearTime = 0;
    let showingComboText = false;
    const COMBO_TIME_WINDOW = 10000; // Thời gian tính combo (10 giây)
    const COMBO_DISPLAY_TIME = 1500; // Thời gian hiển thị thông báo combo (1.5 giây)
    
    // Thêm biến cho chế độ "ma thuật"
    let isMagicMode = false;
    const MAGIC_COLOR_CHANGE_SPEED = 20; // Tốc độ thay đổi màu
    let magicHueValue = 0;
    
    // Thêm biến cho tính năng gợi ý
    let showHint = false;
    let hintPosition = null;
    let hintRotation = 0;
    
    // Danh sách các khối tiếp theo (5 khối)
    const nextPiecesQueue = [];
    const QUEUE_SIZE = 5; // Số lượng khối trong hàng đợi
    
    // Biến cho việc trì hoãn khi khối chạm đất
    const LOCK_DELAY = 500; // Thời gian trì hoãn 500ms
    const MAX_LOCK_RESETS = 15; // Số lần di chuyển/xoay tối đa trước khi buộc khóa
    const MAX_LOCK_TIME = 5000; // Thời gian tối đa (5 giây) trước khi buộc khóa
    let lockDelayTimer = null;
    let lockResetCount = 0; // Đếm số lần reset lock delay
    let lockStartTime = 0; // Thời điểm bắt đầu trạng thái khóa
    let canMove = true;
    let lastGroundedPosition = null;
    
    // Biến theo dõi khối trước đó
    let lastPieceIndex = -1; // -1 nghĩa là chưa có khối nào
    
    // Hệ thống 7-bag randomizer
    let currentBag = []; // Túi hiện tại chứa các khối
    let nextBag = []; // Túi tiếp theo cho việc chuẩn bị
    const READY_BAGS = 2; // Số lượng túi chuẩn bị sẵn

    // Danh sách các túi đã chuẩn bị sẵn
    let preparedBags = [];
    
    // Tạo một túi mới chứa 7 khối xáo trộn ngẫu nhiên
    function generateNewBag() {
        // Tạo mảng các chỉ số khối (0-6 tương ứng với I, J, L, O, S, T, Z)
        const indices = [0, 1, 2, 3, 4, 5, 6];
        
        // Xáo trộn mảng theo thuật toán Fisher-Yates
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        // Kiểm tra tính hợp lệ của bag mới
        if (new Set(indices).size !== 7) {
            console.error("LỖI: Bag không hợp lệ - số lượng khối độc nhất không đủ 7");
            // Nếu xảy ra lỗi, tạo một mảng mới có đủ 7 khối theo thứ tự ngẫu nhiên
            const fallbackBag = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
            console.log("Túi dự phòng được tạo: " + fallbackBag.map(getPieceName).join(", "));
            return fallbackBag;
        }
        
        console.log("Tạo túi mới: " + indices.map(getPieceName).join(", "));
        return indices;
    }
    
    // Khởi tạo hệ thống túi
    function initBagSystem() {
        // Xóa các túi cũ nếu có
        preparedBags = [];
        
        // Tạo các túi mới
        for (let i = 0; i < READY_BAGS; i++) {
            preparedBags.push(generateNewBag());
        }
        
        // Gán túi đầu tiên là túi hiện tại
        currentBag = [...preparedBags[0]];
        
        // Chuẩn bị túi mới cho lần sau
        preparedBags.shift();
        preparedBags.push(generateNewBag());
        
        // Đảm bảo và ghi log trạng thái của túi ban đầu
        console.log("Túi hiện tại sau khởi tạo:", currentBag.map(getPieceName).join(", "));
        console.log("Các túi đã chuẩn bị:", preparedBags.map(bag => bag.map(getPieceName).join(", ")));
    }
    
    // Lấy chỉ số khối tiếp theo từ túi 7-bag
    function getNextPieceFromBag() {
        // Nếu túi hiện tại rỗng, lấy túi tiếp theo
        if (currentBag.length === 0) {
            currentBag = [...preparedBags[0]];
            preparedBags.shift();
            preparedBags.push(generateNewBag());
        }
        
        // Lấy và xóa phần tử đầu tiên của túi
        const nextIndex = currentBag.shift();
        return nextIndex;
    }
    
    // Lấy tên khối để hiển thị trong console
    function getPieceName(index) {
        const pieceNames = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        return pieceNames[index];
    }
    
    // Tạo khối ngẫu nhiên sử dụng hệ thống 7-bag
    function randomPiece() {
        const randomIndex = getNextPieceFromBag();
        const piece = new Piece(PIECES[randomIndex]);
        console.log("Tạo khối mới: " + getPieceName(randomIndex) + ", pieceType=" + piece.pieceType);
        return piece;
    }
    
    // Định nghĩa các khối Tetris
    const PIECES = [
        {
            // I
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            color: '#00FFFF' // Cyan rực rỡ hơn
        },
        {
            // J
            shape: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#0000FF' // Xanh dương sáng
        },
        {
            // L
            shape: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#FF7F00' // Cam sáng
        },
        {
            // O
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: '#FFFF00' // Vàng rực
        },
        {
            // S
            shape: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            color: '#00FF00' // Xanh lá tươi
        },
        {
            // T
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#9900FF' // Tím rực rỡ hơn
        },
        {
            // Z
            shape: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            color: '#FF0000' // Đỏ tươi
        }
    ];
    
    // Class cho mỗi khối Tetris
    class Piece {
        constructor(piece, isHeld = false) {
            this.shape = JSON.parse(JSON.stringify(piece.shape)); // Tạo bản sao sâu
            this.color = piece.color;
            this.originalColor = piece.color; // Lưu màu gốc
            this.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(this.shape[0].length / 2);
            this.y = 0;
            this.isHeld = isHeld; // Đánh dấu nếu là khối được giữ
            this.pieceType = PIECES.findIndex(p => JSON.stringify(p.shape) === JSON.stringify(piece.shape));
            this.rotation = 0; // Thêm thuộc tính để theo dõi hướng xoay
            
            // Thêm để hỗ trợ chế độ ma thuật
            this.hueValue = Math.floor(Math.random() * 360);
        }
        
        // Vẽ khối
        draw() {
            // Cập nhật màu sắc nếu đang ở chế độ ma thuật
            if (isMagicMode) {
                this.hueValue = (this.hueValue + MAGIC_COLOR_CHANGE_SPEED / 10) % 360;
                this.color = `hsl(${this.hueValue}, 100%, 50%)`;
            } else {
                this.color = this.originalColor;
            }
            
            for (let row = 0; row < this.shape.length; row++) {
                for (let col = 0; col < this.shape[row].length; col++) {
                    if (this.shape[row][col]) {
                        // Vẽ khối với hiệu ứng hiện đại
                        const x = (this.x + col) * BLOCK_SIZE;
                        const y = (this.y + row) * BLOCK_SIZE;
                        
                        // Vẽ bóng đổ bên dưới
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                        ctx.fillRect(
                            x + 2, 
                            y + 2, 
                            BLOCK_SIZE - 2, 
                            BLOCK_SIZE - 2
                        );
                        
                        // Vẽ khối chính với gradient hiện đại
                        const gradient = ctx.createLinearGradient(x, y, x + BLOCK_SIZE, y + BLOCK_SIZE);
                        gradient.addColorStop(0, this.color);
                        
                        // Nếu màu là HSL, tự tính toán màu tối hơn
                        if (this.color.startsWith('hsl')) {
                            const hslMatch = this.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
                            if (hslMatch) {
                                const h = hslMatch[1];
                                const s = hslMatch[2];
                                const l = Math.max(parseInt(hslMatch[3]) - 20, 0);
                                gradient.addColorStop(1, `hsl(${h}, ${s}%, ${l}%)`);
                            } else {
                                gradient.addColorStop(1, this.color);
                            }
                        } else {
                            // Sử dụng hàm sẵn có cho màu HEX/RGB
                            gradient.addColorStop(1, this.darkenColor(this.color, 30));
                        }
                        
                        // Vẽ khối với bo góc nhẹ (kiểu Tetr.io)
                        const radius = 3; // Bo góc nhỏ cho kiểu hiện đại
                        
                        ctx.beginPath();
                        ctx.moveTo(x + radius, y);
                        ctx.lineTo(x + BLOCK_SIZE - radius, y);
                        ctx.quadraticCurveTo(x + BLOCK_SIZE, y, x + BLOCK_SIZE, y + radius);
                        ctx.lineTo(x + BLOCK_SIZE, y + BLOCK_SIZE - radius);
                        ctx.quadraticCurveTo(x + BLOCK_SIZE, y + BLOCK_SIZE, x + BLOCK_SIZE - radius, y + BLOCK_SIZE);
                        ctx.lineTo(x + radius, y + BLOCK_SIZE);
                        ctx.quadraticCurveTo(x, y + BLOCK_SIZE, x, y + BLOCK_SIZE - radius);
                        ctx.lineTo(x, y + radius);
                        ctx.quadraticCurveTo(x, y, x + radius, y);
                        ctx.closePath();
                        
                        ctx.fillStyle = gradient;
                        ctx.fill();
                        
                        // Thêm hiệu ứng ánh sáng ở góc trên trái (kiểu hiện đại)
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.beginPath();
                        ctx.moveTo(x + 2, y + 2);
                        ctx.lineTo(x + BLOCK_SIZE / 3, y + 2);
                        ctx.lineTo(x + 2, y + BLOCK_SIZE / 3);
                        ctx.fill();
                        
                        // Thêm viền mỏng cho khối
                        ctx.strokeStyle = this.darkenColor(this.color, 40);
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
            
            // Vẽ bóng của khối
            this.drawShadow();
        }
        
        // Cập nhật phương thức vẽ bóng cho kiểu hiện đại
        drawShadow() {
            // Tạo một bản sao vị trí hiện tại
            const xOriginal = this.x;
            const yOriginal = this.y;
            
            // Tìm vị trí thấp nhất có thể
            let dropY = 0;
            while (!this.collision()) {
                this.y++;
                dropY++;
            }
            this.y--;
            dropY--;
            
            // Vẽ bóng nếu có vị trí hợp lệ
            if (dropY > 0) {
                for (let row = 0; row < this.shape.length; row++) {
                    for (let col = 0; col < this.shape[row].length; col++) {
                        if (this.shape[row][col]) {
                            const x = (this.x + col) * BLOCK_SIZE;
                            const y = (this.y + row) * BLOCK_SIZE;
                            
                            // Vẽ bóng với hiệu ứng trong suốt kiểu Tetr.io
                            const radius = 3; // Bo góc nhỏ giống khối chính
                            
                            ctx.beginPath();
                            ctx.moveTo(x + radius, y);
                            ctx.lineTo(x + BLOCK_SIZE - radius, y);
                            ctx.quadraticCurveTo(x + BLOCK_SIZE, y, x + BLOCK_SIZE, y + radius);
                            ctx.lineTo(x + BLOCK_SIZE, y + BLOCK_SIZE - radius);
                            ctx.quadraticCurveTo(x + BLOCK_SIZE, y + BLOCK_SIZE, x + BLOCK_SIZE - radius, y + BLOCK_SIZE);
                            ctx.lineTo(x + radius, y + BLOCK_SIZE);
                            ctx.quadraticCurveTo(x, y + BLOCK_SIZE, x, y + BLOCK_SIZE - radius);
                            ctx.lineTo(x, y + radius);
                            ctx.quadraticCurveTo(x, y, x + radius, y);
                            ctx.closePath();
                            
                            // Đổ màu bóng kiểu hiện đại - trắng nhạt
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                            ctx.fill();
                            
                            // Thêm viền mỏng cho bóng
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }
                    }
                }
            }
            
            // Khôi phục vị trí ban đầu
            this.x = xOriginal;
            this.y = yOriginal;
        }
        
        // Vẽ khối tiếp theo
        drawNext() {
            if (!nextPiecesQueue[0]) return;
            
            // Lấy thông tin khối
            const shape = PIECES[nextPiecesQueue[0].pieceType].shape;
            const color = PIECES[nextPiecesQueue[0].pieceType].color;
            
            // Xóa canvas
            nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
            
            // Vẽ nền gradient
            const gradient = nextCtx.createLinearGradient(0, 0, 0, nextCanvas.height);
            gradient.addColorStop(0, '#222');
            gradient.addColorStop(1, '#111');
            nextCtx.fillStyle = gradient;
            nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
            
            // Vẽ viền
            nextCtx.strokeStyle = '#555';
            nextCtx.lineWidth = 2;
            nextCtx.strokeRect(0, 0, nextCanvas.width, nextCanvas.height);
            
            // Tính kích thước khối để vừa với canvas
            const blockSize = Math.min(
                Math.floor((nextCanvas.width - 40) / shape[0].length),
                Math.floor((nextCanvas.height - 40) / shape.length)
            );
            
            // Tính toán vị trí trung tâm
            const offsetX = (nextCanvas.width - shape[0].length * blockSize) / 2;
            const offsetY = (nextCanvas.height - shape.length * blockSize) / 2;
            
            // Vẽ bóng đổ cho tất cả khối
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = offsetX + col * blockSize;
                        const y = offsetY + row * blockSize;
                        
                        // Vẽ bóng đổ
                        nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                        nextCtx.fillRect(
                            x + 3,
                            y + 3,
                            blockSize - 2,
                            blockSize - 2
                        );
                    }
                }
            }
            
            // Vẽ từng khối
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = offsetX + col * blockSize;
                        const y = offsetY + row * blockSize;
                        
                        // Vẽ khối chính
                        nextCtx.fillStyle = color;
                        nextCtx.fillRect(
                            x + 1,
                            y + 1,
                            blockSize - 2,
                            blockSize - 2
                        );
                        
                        // Thêm hiệu ứng ánh sáng ở góc trên trái
                        nextCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        nextCtx.beginPath();
                        nextCtx.moveTo(x + 1, y + 1);
                        nextCtx.lineTo(x + blockSize / 3, y + 1);
                        nextCtx.lineTo(x + 1, y + blockSize / 3);
                        nextCtx.fill();
                        
                        // Thêm viền
                        nextCtx.strokeStyle = currentPiece.darkenColor(color, 50);
                        nextCtx.lineWidth = 1;
                        nextCtx.strokeRect(
                            x + 1,
                            y + 1,
                            blockSize - 2,
                            blockSize - 2
                        );
                    }
                }
            }
        }
        
        // Vẽ khối giữ (hold)
        drawHold() {
            if (!heldPiece) {
                // Xóa canvas
                holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
                
                // Vẽ nền gradient
                const gradient = holdCtx.createLinearGradient(0, 0, 0, holdCanvas.height);
                gradient.addColorStop(0, '#222');
                gradient.addColorStop(1, '#111');
                holdCtx.fillStyle = gradient;
                holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
                
                // Vẽ viền
                holdCtx.strokeStyle = '#444';
                holdCtx.lineWidth = 2;
                holdCtx.strokeRect(0, 0, holdCanvas.width, holdCanvas.height);
                
                // Vẽ chữ "EMPTY"
                holdCtx.fillStyle = '#555';
                holdCtx.font = '12px Arial';
                holdCtx.textAlign = 'center';
                holdCtx.fillText('TRỐNG', holdCanvas.width / 2, holdCanvas.height / 2);
                
                return;
            }
            
            // Lấy thông tin khối
            const shape = heldPiece.shape;
            const color = heldPiece.color;
            
            // Xóa canvas
            holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
            
            // Vẽ nền gradient
            const gradient = holdCtx.createLinearGradient(0, 0, 0, holdCanvas.height);
            gradient.addColorStop(0, '#222');
            gradient.addColorStop(1, '#111');
            holdCtx.fillStyle = gradient;
            holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
            
            // Vẽ viền
            if (hasHeldThisTurn) {
                holdCtx.strokeStyle = '#333'; // Viền tối hơn nếu đã sử dụng
            } else {
                holdCtx.strokeStyle = '#555';
            }
            holdCtx.lineWidth = 2;
            holdCtx.strokeRect(0, 0, holdCanvas.width, holdCanvas.height);
            
            // Tính kích thước khối để vừa với canvas
            const blockSize = Math.min(
                Math.floor((holdCanvas.width - 40) / shape[0].length),
                Math.floor((holdCanvas.height - 40) / shape.length)
            );
            
            // Tính toán vị trí trung tâm
            const offsetX = (holdCanvas.width - shape[0].length * blockSize) / 2;
            const offsetY = (holdCanvas.height - shape.length * blockSize) / 2;
            
            // Vẽ bóng đổ cho tất cả khối
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = offsetX + col * blockSize;
                        const y = offsetY + row * blockSize;
                        
                        // Vẽ bóng đổ
                        holdCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                        holdCtx.fillRect(
                            x + 3,
                            y + 3,
                            blockSize - 2,
                            blockSize - 2
                        );
                    }
                }
            }
            
            // Vẽ từng khối
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = offsetX + col * blockSize;
                        const y = offsetY + row * blockSize;
                        
                        // Màu sắc của khối (mờ hơn nếu đã sử dụng)
                        let blockColor = color;
                        if (hasHeldThisTurn) {
                            // Làm tối màu sắc nếu đã sử dụng hold trong lượt này
                            blockColor = currentPiece.darkenColor(color, 30);
                        }
                        
                        // Vẽ khối chính
                        holdCtx.fillStyle = blockColor;
                        holdCtx.fillRect(
                            x + 1,
                            y + 1,
                            blockSize - 2,
                            blockSize - 2
                        );
                        
                        // Thêm hiệu ứng ánh sáng ở góc trên trái
                        holdCtx.fillStyle = hasHeldThisTurn ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.4)';
                        holdCtx.beginPath();
                        holdCtx.moveTo(x + 1, y + 1);
                        holdCtx.lineTo(x + blockSize / 3, y + 1);
                        holdCtx.lineTo(x + 1, y + blockSize / 3);
                        holdCtx.fill();
                        
                        // Thêm viền
                        holdCtx.strokeStyle = currentPiece.darkenColor(blockColor, 50);
                        holdCtx.lineWidth = 1;
                        holdCtx.strokeRect(
                            x + 1,
                            y + 1,
                            blockSize - 2,
                            blockSize - 2
                        );
                    }
                }
            }
            
            // Nếu đã sử dụng hold, hiển thị dấu X mờ
            if (hasHeldThisTurn) {
                holdCtx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
                holdCtx.lineWidth = 2;
                holdCtx.beginPath();
                holdCtx.moveTo(20, 20);
                holdCtx.lineTo(holdCanvas.width - 20, holdCanvas.height - 20);
                holdCtx.moveTo(holdCanvas.width - 20, 20);
                holdCtx.lineTo(20, holdCanvas.height - 20);
                holdCtx.stroke();
            }
        }
        
        // Vẽ các khối tiếp theo trong hàng đợi
        drawNextQueue(index) {
            let targetCtx, targetCanvas;
            switch(index) {
                case 0:
                    targetCtx = nextCtx1;
                    targetCanvas = nextCanvas1;
                    break;
                case 1:
                    targetCtx = nextCtx2;
                    targetCanvas = nextCanvas2;
                    break;
                case 2:
                    targetCtx = nextCtx3;
                    targetCanvas = nextCanvas3;
                    break;
                case 3:
                    targetCtx = nextCtx4;
                    targetCanvas = nextCanvas4;
                    break;
                default:
                    return;
            }
            
            // Xóa canvas và vẽ nền
            targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
            
            // Tạo gradient cho nền với hiệu ứng ánh sáng
            const bgGradient = targetCtx.createRadialGradient(
                targetCanvas.width/2, targetCanvas.height/2, 5,
                targetCanvas.width/2, targetCanvas.height/2, targetCanvas.width
            );
            bgGradient.addColorStop(0, '#191919');
            bgGradient.addColorStop(1, '#000');
            targetCtx.fillStyle = bgGradient;
            targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
            
            // Thêm viền cho canvas, với độ sáng giảm dần theo thứ tự
            const alpha = 1 - (index * 0.15);
            targetCtx.strokeStyle = `rgba(120, 120, 120, ${alpha})`;
            targetCtx.lineWidth = 2;
            targetCtx.strokeRect(0, 0, targetCanvas.width, targetCanvas.height);
            
            // Tính toán kích thước và vị trí để khối vừa với canvas
            const blockSize = 15;
            const offsetX = (targetCanvas.width - this.shape[0].length * blockSize) / 2;
            const offsetY = (targetCanvas.height - this.shape.length * blockSize) / 2;
            
            // Vẽ bóng đổ cho tất cả khối
            for (let row = 0; row < this.shape.length; row++) {
                for (let col = 0; col < this.shape[row].length; col++) {
                    if (this.shape[row][col]) {
                        const x = offsetX + col * blockSize;
                        const y = offsetY + row * blockSize;
                        
                        // Vẽ bóng đổ với hiệu ứng mờ
                        targetCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                        targetCtx.fillRect(
                            x + 2,
                            y + 2,
                            blockSize,
                            blockSize
                        );
                    }
                }
            }
            
            // Vẽ từng khối của hình
            for (let row = 0; row < this.shape.length; row++) {
                for (let col = 0; col < this.shape[row].length; col++) {
                    if (this.shape[row][col]) {
                        const x = offsetX + col * blockSize;
                        const y = offsetY + row * blockSize;
                        
                        // Vẽ khối chính với gradient
                        const gradient = targetCtx.createLinearGradient(x, y, x + blockSize, y + blockSize);
                        gradient.addColorStop(0, this.color);
                        gradient.addColorStop(1, this.darkenColor(this.color, 40));
                        
                        targetCtx.fillStyle = gradient;
                        targetCtx.fillRect(
                            x,
                            y,
                            blockSize - 1,
                            blockSize - 1
                        );
                        
                        // Thêm hiệu ứng ánh sáng ở góc trên trái
                        targetCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                        targetCtx.beginPath();
                        targetCtx.moveTo(x, y);
                        targetCtx.lineTo(x + blockSize/3, y);
                        targetCtx.lineTo(x, y + blockSize/3);
                        targetCtx.fill();
                        
                        // Thêm hiệu ứng ánh sáng ở góc phải dưới
                        nextCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                        nextCtx.beginPath();
                        nextCtx.moveTo(x + blockSize - 1, y + blockSize - 1);
                        nextCtx.lineTo(x + blockSize - 1, y + blockSize - 1 - blockSize/4);
                        nextCtx.lineTo(x + blockSize - 1 - blockSize/4, y + blockSize - 1);
                        nextCtx.fill();
                        
                        // Thêm viền cho khối
                        nextCtx.strokeStyle = this.darkenColor(this.color, 60);
                        nextCtx.lineWidth = 1;
                        nextCtx.strokeRect(
                            x,
                            y,
                            blockSize - 1,
                            blockSize - 1
                        );
                    }
                }
            }
            
            // Thêm hiệu ứng phản chiếu ánh sáng
            targetCtx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height/3);
        }
        
        // Phương thức chung để vẽ khối lên một canvas cụ thể
        _drawOnCanvas(targetCtx, canvasWidth, canvasHeight, blockSize) {
            // Xóa canvas và vẽ nền
            targetCtx.clearRect(0, 0, canvasWidth, canvasHeight);
            
            // Tạo gradient cho nền
            const bgGradient = targetCtx.createLinearGradient(0, 0, 0, canvasHeight);
            bgGradient.addColorStop(0, '#111');
            bgGradient.addColorStop(1, '#000');
            targetCtx.fillStyle = bgGradient;
            targetCtx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            // Thêm viền cho canvas
            targetCtx.strokeStyle = '#333';
            targetCtx.lineWidth = 2;
            targetCtx.strokeRect(0, 0, canvasWidth, canvasHeight);
            
            const offsetX = (canvasWidth - this.shape[0].length * blockSize) / 2;
            const offsetY = (canvasHeight - this.shape.length * blockSize) / 2;
            
            // Vẽ từng khối của hình
            for (let row = 0; row < this.shape.length; row++) {
                for (let col = 0; col < this.shape[row].length; col++) {
                    if (this.shape[row][col]) {
                        const x = offsetX + col * blockSize;
                        const y = offsetY + row * blockSize;
                        
                        // Vẽ bóng đổ dưới mỗi khối
                        targetCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                        targetCtx.fillRect(
                            x + 2,
                            y + 2,
                            blockSize - 2,
                            blockSize - 2
                        );
                        
                        // Vẽ khối chính với gradient
                        const gradient = targetCtx.createLinearGradient(x, y, x + blockSize, y + blockSize);
                        gradient.addColorStop(0, this.color);
                        
                        // Nếu màu là HSL, tự tính toán màu tối hơn
                        if (this.color.startsWith('hsl')) {
                            const hslMatch = this.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
                            if (hslMatch) {
                                const h = hslMatch[1];
                                const s = hslMatch[2];
                                const l = Math.max(parseInt(hslMatch[3]) - 20, 0);
                                gradient.addColorStop(1, `hsl(${h}, ${s}%, ${l}%)`);
                            } else {
                                gradient.addColorStop(1, this.color);
                            }
                        } else {
                            // Sử dụng hàm sẵn có cho màu HEX/RGB
                            gradient.addColorStop(1, this.darkenColor(this.color, 30));
                        }
                        
                        targetCtx.fillStyle = gradient;
                        targetCtx.fillRect(
                            x + 1,
                            y + 1,
                            blockSize - 2,
                            blockSize - 2
                        );
                        
                        // Thêm hiệu ứng ánh sáng ở góc trên trái
                        targetCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        targetCtx.beginPath();
                        targetCtx.moveTo(x + 1, y + 1);
                        targetCtx.lineTo(x + blockSize / 3, y + 1);
                        targetCtx.lineTo(x + 1, y + blockSize / 3);
                        targetCtx.fill();
                        
                        // Thêm viền cho khối
                        targetCtx.strokeStyle = this.darkenColor(this.color, 50);
                        targetCtx.lineWidth = 1;
                        targetCtx.strokeRect(
                            x + 1,
                            y + 1,
                            blockSize - 2,
                            blockSize - 2
                        );
                    }
                }
            }
            
            // Vẽ một chút hiệu ứng ánh sáng cho màn hình
            targetCtx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            targetCtx.fillRect(0, 0, canvasWidth, canvasHeight / 4);
        }
        
        // Thêm phương thức để làm tối màu sắc
        darkenColor(color, percent) {
            // Chuyển đổi màu HEX sang RGB
            let r, g, b;
            if (color.startsWith('#')) {
                const hex = color.substring(1);
                r = parseInt(hex.substr(0, 2), 16);
                g = parseInt(hex.substr(2, 2), 16);
                b = parseInt(hex.substr(4, 2), 16);
            } else if (color.startsWith('rgb')) {
                const rgbValues = color.match(/\d+/g);
                r = parseInt(rgbValues[0]);
                g = parseInt(rgbValues[1]);
                b = parseInt(rgbValues[2]);
            } else {
                return color; // Trả về màu ban đầu nếu không nhận dạng được
            }
            
            // Làm tối màu theo phần trăm
            r = Math.max(0, r - (r * percent / 100));
            g = Math.max(0, g - (g * percent / 100));
            b = Math.max(0, b - (b * percent / 100));
            
            // Chuyển đổi ngược lại sang HEX
            return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        }
        
        // Di chuyển
        move(direction) {
            if (isGameOver || !canMove) return false;
            
            // Lưu vị trí cũ
            const oldX = this.x;
            const oldY = this.y;
            const wasGrounded = this.checkGrounded();
            
            // Di chuyển theo hướng
            if (direction === 'left') {
                    this.x--;
            } else if (direction === 'right') {
                    this.x++;
            } else if (direction === 'down') {
                    this.y++;
            }
            
            // Kiểm tra va chạm
            if (this.collision()) {
                // Khôi phục vị trí cũ nếu va chạm
                this.x = oldX;
                this.y = oldY;
                
                // Nếu di chuyển xuống và gặp va chạm, khởi động lock delay
                if (direction === 'down' && !lockDelayTimer) {
                    this.startLockDelay();
                }
                
                return false;
            }
            
            // Phát âm thanh khi di chuyển
            if (direction === 'left' || direction === 'right') {
                playSound('move');
            }
            
            // Kiểm tra nếu vừa rời khỏi mặt đất
            const isGrounded = this.checkGrounded();
            if (wasGrounded && !isGrounded) {
                // Hủy lock delay nếu không còn chạm đất
                if (lockDelayTimer) {
                    clearTimeout(lockDelayTimer);
                    lockDelayTimer = null;
                }
            } else if (!wasGrounded && isGrounded) {
                // Bắt đầu lock delay nếu vừa chạm đất
                this.startLockDelay();
            }
            
            // Cộng điểm nếu di chuyển xuống
            if (direction === 'down') {
                score++;
                updateScore();
            }
            
            return true;
        }
        
        // Bắt đầu đếm thời gian trước khi khóa khối
        startLockDelay() {
            // Nếu đây là lần đầu tiên bắt đầu delay (không phải reset)
            if (!lockDelayTimer && lockResetCount === 0) {
                lockStartTime = Date.now();
            }
            
            // Lưu vị trí hiện tại của khối
            lastGroundedPosition = {
                x: this.x,
                y: this.y,
                shape: JSON.parse(JSON.stringify(this.shape))
            };
            
            // Hủy bỏ timer hiện tại nếu có
            if (lockDelayTimer) {
                clearTimeout(lockDelayTimer);
            }
            
            // Đặt lại timer mới
            lockDelayTimer = setTimeout(() => {
                this.forceLock();
            }, LOCK_DELAY);
        }
        
        // Khóa khối ngay lập tức (không còn delay)
        forceLock() {
            // Nếu đã có quá nhiều lần reset hoặc đã quá thời gian tối đa
            const timeSinceLockStart = Date.now() - lockStartTime;
            if (lockResetCount >= MAX_LOCK_RESETS || timeSinceLockStart >= MAX_LOCK_TIME) {
                console.log("Buộc khóa khối do đã quá giới hạn reset hoặc thời gian");
                canMove = false; // Ngăn di chuyển trong quá trình lock
                // Khóa khối vào bảng
                this.lock();
                
                // Kiểm tra xóa dòng
                checkLines();
                
                // Lấy khối mới nếu game chưa kết thúc
                if (!isGameOver) {
                    // Reset biến hold
                    hasHeldThisTurn = false;
                    getNewPiece();
                }
                
                // Reset các biến liên quan
                lockDelayTimer = null;
                lockResetCount = 0;
                lockStartTime = 0;
                canMove = true;
            } else {
                // Khởi động lại timer
                this.startLockDelay();
            }
        }
        
        // Reset delay khóa khi di chuyển hoặc xoay
        resetLockDelay() {
            // Kiểm tra xem khối có đang chạm đất không
            const yOld = this.y;
            this.y++; // Thử di chuyển xuống 1 đơn vị
            
            const isGrounded = this.collision();
            this.y = yOld; // Khôi phục vị trí
            
            // Nếu khối đang chạm đất và có timer đang chạy
            if (isGrounded && lockDelayTimer) {
                // Kiểm tra xem vị trí hoặc hình dáng có thay đổi so với lần cuối không
                const hasChanged = !lastGroundedPosition ||
                    this.x !== lastGroundedPosition.x ||
                    this.y !== lastGroundedPosition.y ||
                    JSON.stringify(this.shape) !== JSON.stringify(lastGroundedPosition.shape);
                
                // Nếu có thay đổi, reset delay
                if (hasChanged) {
                    // Tăng bộ đếm reset
                    lockResetCount++;
                    
                    // Reset timer
                    clearTimeout(lockDelayTimer);
                    
                    // Nếu chưa vượt quá giới hạn, tạo timer mới
                    if (lockResetCount < MAX_LOCK_RESETS) {
                        lockDelayTimer = setTimeout(() => {
                            this.forceLock();
                        }, LOCK_DELAY);
                    } else {
                        // Nếu vượt quá giới hạn, buộc khóa ngay lập tức
                        this.forceLock();
                    }
                    
                    // Cập nhật vị trí cuối
                    lastGroundedPosition = {
                        x: this.x,
                        y: this.y,
                        shape: JSON.parse(JSON.stringify(this.shape))
                    };
                }
            }
        }
        
        // Xoay khối
        rotate(direction = 'right') {
            if (isGameOver || !canMove) return false;
            
            const originalShape = JSON.parse(JSON.stringify(this.shape));
            const n = this.shape.length;
            
            // Xoay ma trận hình dạng
            const rotatedShape = Array(n).fill().map(() => Array(n).fill(0));
            
            if (direction === 'right') {
                // Xoay 90 độ theo chiều kim đồng hồ
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < n; j++) {
                        rotatedShape[j][n - 1 - i] = this.shape[i][j];
                    }
                }
                // Cập nhật thuộc tính rotation
                this.rotation = (this.rotation + 1) % 4;
            } else if (direction === 'left') {
                // Xoay 90 độ ngược chiều kim đồng hồ
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < n; j++) {
                        rotatedShape[n - 1 - j][i] = this.shape[i][j];
                    }
                }
                // Cập nhật thuộc tính rotation
                this.rotation = (this.rotation + 3) % 4; // +3 thay vì -1 để tránh số âm
            }
            
            // Thử áp dụng xoay
            this.shape = rotatedShape;
            
            // Kiểm tra va chạm sau khi xoay
            if (this.collision()) {
                // Thử di chuyển sang trái/phải để tránh va chạm (wall kick)
                const wallKickOffsets = [0, 1, -1, 2, -2]; // Thử các vị trí bên cạnh
                let offsetSuccess = false;
                
                for (const xOffset of wallKickOffsets) {
                    this.x += xOffset;
                    if (!this.collision()) {
                        offsetSuccess = true;
                        playSound('rotate');
                        this.resetLockDelay();
                        break;
                    }
                    this.x -= xOffset;
                }
                
                // Nếu không thể áp dụng wall kick, hủy bỏ xoay
                if (!offsetSuccess) {
                    this.shape = originalShape;
                    // Khôi phục lại giá trị rotation ban đầu
                    if (direction === 'right') {
                        this.rotation = (this.rotation + 3) % 4; // Quay lại trạng thái trước
                    } else {
                        this.rotation = (this.rotation + 1) % 4; // Quay lại trạng thái trước
                    }
                    return false;
                }
            } else {
                playSound('rotate');
                this.resetLockDelay();
            }
            
            // Kiểm tra T-spin
            if (this.isTShape()) {
                this.checkTSpin();
            }
            
            return true;
        }
        
        // Kiểm tra xem có phải khối T không
        isTShape() {
            // Khối T có dạng
            // 0 1 0
            // 1 1 1
            // 0 0 0
            if (this.shape.length !== 3 || this.shape[0].length !== 3) return false;
            
            const middleRow = this.shape[1];
            if (middleRow[0] === 1 && middleRow[1] === 1 && middleRow[2] === 1) {
                if ((this.shape[0][1] === 1 && this.shape[0][0] === 0 && this.shape[0][2] === 0) ||
                    (this.shape[2][1] === 1 && this.shape[2][0] === 0 && this.shape[2][2] === 0) || 
                    (this.shape[1][0] === 1 && this.shape[0][0] === 0 && this.shape[2][0] === 0) ||
                    (this.shape[1][2] === 1 && this.shape[0][2] === 0 && this.shape[2][2] === 0)) {
                    return true;
                }
            }
            return false;
        }
        
        // Kiểm tra xem có T-spin không
        checkTSpin() {
            // T-spin xảy ra khi khối T được xoay vào một góc khó
            // Kiểm tra 3/4 góc xung quanh tâm của khối T có bị chặn không
            let cornersBlocked = 0;
            
            // Kiểm tra 4 góc xung quanh tâm của khối T
            const corners = [
                {x: this.x, y: this.y}, // Góc trên trái
                {x: this.x + 2, y: this.y}, // Góc trên phải
                {x: this.x, y: this.y + 2}, // Góc dưới trái
                {x: this.x + 2, y: this.y + 2} // Góc dưới phải
            ];
            
            corners.forEach(corner => {
                // Góc bị chặn nếu ra ngoài bảng hoặc có khối khác
                if (corner.x < 0 || corner.x >= BOARD_WIDTH || 
                    corner.y < 0 || corner.y >= BOARD_HEIGHT ||
                    (corner.y >= 0 && BOARD[corner.y][corner.x])) {
                    cornersBlocked++;
                }
            });
            
            return cornersBlocked >= 3;
        }
        
        // Kiểm tra va chạm
        collision() {
            for (let row = 0; row < this.shape.length; row++) {
                for (let col = 0; col < this.shape[row].length; col++) {
                    if (this.shape[row][col]) {
                        const x = this.x + col;
                        const y = this.y + row;
                        
                        // Kiểm tra biên
                        if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) {
                            return true;
                        }
                        
                        // Kiểm tra va chạm với các khối đã có
                        if (y >= 0 && BOARD[y][x]) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        
        // Khóa khối vào bảng
        lock() {
            // Thêm khối vào bảng
            for (let row = 0; row < this.shape.length; row++) {
                for (let col = 0; col < this.shape[row].length; col++) {
                    if (this.shape[row][col]) {
                        const boardY = this.y + row;
                        const boardX = this.x + col;
                        
                        if (boardY < 0) {
                            // Game over nếu khối bị khóa ngoài bảng
                            gameOver();
                            return;
                        }
                        
                        BOARD[boardY][boardX] = this.color;
                    }
                }
            }
            
            // Xóa các dòng đã hoàn thành
            checkLines();
            
            // Chỉ tiếp tục nếu không có game over
            if (!isGameOver) {
                // Reset biến hold
                hasHeldThisTurn = false;
                
                // Tạo khối mới
                getNewPiece();
            }
        }
        
        // Thả rơi nhanh
        hardDrop() {
            // Di chuyển khối xuống cho đến khi va chạm
            while (!this.collision()) {
                this.y++;
            }
            this.y--; // Lùi lại một bước khi va chạm
            
            // Khóa khối vào vị trí
                this.lock();
            
            // Phát âm thanh thả rơi
            playSound('drop');
            
            // Cập nhật điểm
            score += 2 * (this.y + 1); // Thưởng điểm cho hard drop
            updateScore();
            
            // Lưu ý: Không tự động tạo khối mới ở đây như trước
            // Để ngăn việc khối tiếp theo tự động rơi khi giữ phím Space
        }
        
        // Hàm giữ khối (hold)
        hold() {
            if (isGameOver || !canMove || hasHeldThisTurn) return false;
            
            playSound('rotate'); // Phát âm thanh khi hold
            
            // Đánh dấu đã hold trong lượt này
            hasHeldThisTurn = true;
            
            if (heldPiece === null) {
                // Nếu chưa có khối nào được giữ
                heldPiece = PIECES[this.pieceType];
                // Tạo khối mới từ hàng đợi
                getNewPiece();
            } else {
                // Nếu đã có khối được giữ, hoán đổi với khối hiện tại
                const currentType = this.pieceType;
                const tempPiece = heldPiece;
                heldPiece = PIECES[currentType];
                
                // Tạo khối mới từ khối đã giữ
                currentPiece = new Piece(tempPiece);
            }
            
            // Vẽ khối đã giữ
            currentPiece.drawShadow();
            new Piece(heldPiece, true).drawHold();
            
            return true;
        }
        
        // Thêm phương thức checkGrounded
        checkGrounded() {
            // Sao lưu vị trí hiện tại
            const currentX = this.x;
            const currentY = this.y;
            
            // Thử di chuyển xuống một ô
            this.y++;
            
            // Kiểm tra xem có va chạm không
            const isGrounded = this.collision();
            
            // Khôi phục vị trí ban đầu
            this.y = currentY;
            
            return isGrounded;
        }
        
        // Cập nhật phương thức resetLockDelay
        resetLockDelay() {
            if (isGameOver) return;
            
            // Tránh reset lock delay quá nhiều lần
            if (lockResetCount >= MAX_LOCK_RESETS) return;
            
            // Chỉ reset nếu đang có lock delay
            if (lockDelayTimer) {
                clearTimeout(lockDelayTimer);
                lockDelayTimer = null;
            }
            
            // Chỉ khởi động lock delay nếu khối đang ở trên mặt đất
            if (this.checkGrounded()) {
                lockResetCount++;
                lockDelayTimer = setTimeout(() => this.forceLock(), LOCK_DELAY);
            }
            
            // Cập nhật vị trí mặt đất cuối cùng để phát hiện T-spin
            lastGroundedPosition = { x: this.x, y: this.y };
        }
    }
    
    // Khởi động game
    function init() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
        
        // Xóa các canvas khối tiếp theo khác
        nextCtx1.clearRect(0, 0, nextCanvas1.width, nextCanvas1.height);
        nextCtx2.clearRect(0, 0, nextCanvas2.width, nextCanvas2.height);
        nextCtx3.clearRect(0, 0, nextCanvas3.width, nextCanvas3.height);
        nextCtx4.clearRect(0, 0, nextCanvas4.width, nextCanvas4.height);
        
        // Xóa bảng
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            for (let col = 0; col < BOARD_WIDTH; col++) {
                BOARD[row][col] = 0;
            }
        }
        
        // Khởi tạo hệ thống túi 7-bag
        initBagSystem();
        
        // Đặt lại điểm số
        score = 0;
        lines = 0;
        level = 1;
        isGameOver = false;
        isPaused = false; // Bắt đầu ở trạng thái chạy luôn
        heldPiece = null;
        hasHeldThisTurn = false;
        
        // Xóa hàng đợi khối tiếp theo
        nextPiecesQueue.length = 0;
        
        updateScore();
        
        // Khởi tạo hàng đợi khối tiếp theo
        fillNextPiecesQueue();
        
        // Tạo các khối đầu tiên
        getNewPiece();
        
        // Bắt đầu game
        lastTime = 0;
        dropCounter = 0;
        update();
        
        // Thêm các control
        addTouchControls();
        addSoundToggle();
        addHintToggle();
        addMagicModeToggle();
        addAutoPlayToggle(); // Thêm nút điều khiển tự động chơi
    }
    
    // Cập nhật và vẽ game
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBoard();
        currentPiece.draw();
        
        if (!isPaused && !isGameOver) {
            requestId = requestAnimationFrame(draw);
        }
    }
    
    // Biến theo dõi lịch sử khối
    let pieceHistory = [];
    const MAX_REPEAT = 2;
    
    // Lấy khối mới
    function getNewPiece() {
        // Đảm bảo hàng đợi luôn có đủ khối
        if (nextPiecesQueue.length < QUEUE_SIZE) {
            fillNextPiecesQueue();
        }
        
        // Lấy khối tiếp theo từ hàng đợi
        currentPiece = nextPiecesQueue.shift();
        console.log("Đã lấy khối: " + getPieceName(currentPiece.pieceType));
        
        // Xuất khối hiện tại ra window để AI có thể truy cập
        window.currentPiece = currentPiece;
        
        // Thêm khối mới vào cuối hàng đợi từ túi
        const newPiece = randomPiece();
        console.log("Thêm khối mới vào cuối hàng đợi: " + getPieceName(newPiece.pieceType));
        nextPiecesQueue.push(newPiece);
        
        // Cập nhật hiển thị các khối tiếp theo
        updateNextPiecesDisplay();
        
        // Đặt lại trạng thái đã giữ cho lượt mới
        hasHeldThisTurn = false;
        
        // Kiểm tra ngay khi tạo khối mới - nếu va chạm, game over
        if (currentPiece.collision()) {
            console.log("Game over - va chạm khi tạo khối mới");
            gameOver();
            return; // Thêm return để ngăn tiếp tục chơi
        }
    }
    
    // Tối ưu hóa hiệu năng khi tab không hiển thị
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Nếu tab không hiển thị, tạm dừng game
            if (!isPaused && !isGameOver) {
                isPaused = true;
                cancelAnimationFrame(requestId);
            }
        }
    });
    
    // Thêm nút tắt/bật âm thanh
    function addSoundToggle() {
        const soundToggle = document.createElement('button');
        soundToggle.id = 'sound-toggle';
        soundToggle.innerHTML = soundsEnabled ? '🔊' : '🔇';
        soundToggle.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid white;
            background-color: rgba(0, 0, 0, 0.5);
            color: white;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        soundToggle.addEventListener('click', () => {
            soundsEnabled = !soundsEnabled;
            soundToggle.innerHTML = soundsEnabled ? '🔊' : '🔇';
        });
        
        document.body.appendChild(soundToggle);
    }
    
    // Thêm style cho hiệu ứng combo
    function addComboStyle() {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            @keyframes comboFade {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1); }
            }
            
            @keyframes shake {
                0% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                50% { transform: translateX(5px); }
                75% { transform: translateX(-5px); }
                100% { transform: translateX(0); }
            }
            
            .shake {
                animation: shake 0.5s;
            }
        `;
        document.head.appendChild(styleEl);
    }
    
    // Hiển thị thông báo combo
    function showComboMessage(combo) {
        if (combo < 2) return; // Chỉ hiển thị nếu combo >= 2
        
        // Ngăn không cho hiển thị quá nhiều thông báo cùng lúc
        if (showingComboText) return;
        
        showingComboText = true;
        
        // Tạo phần tử hiển thị combo
        const comboEl = document.createElement('div');
        comboEl.className = 'combo-text';
        
        // Đặt nội dung và kiểu cho combo text
        comboEl.textContent = `COMBO x${combo}!`;
        comboEl.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: ${getComboColor(combo)};
            font-size: ${Math.min(24 + combo * 3, 48)}px;
            font-weight: bold;
            text-shadow: 0px 0px 10px rgba(255, 255, 255, 0.7);
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            animation: comboFade 1.5s ease-out;
        `;
        
        // Thêm phần tử vào canvas container
        const canvasContainer = canvas.parentElement;
        canvasContainer.style.position = 'relative';
        canvasContainer.appendChild(comboEl);
        
        // Xóa phần tử sau khi animation kết thúc
        setTimeout(() => {
            canvasContainer.removeChild(comboEl);
            showingComboText = false;
        }, COMBO_DISPLAY_TIME);
        
        // Thêm hiệu ứng rung nhẹ cho canvas nếu combo lớn
        if (combo >= 3) {
            canvas.classList.add('shake');
            setTimeout(() => {
                canvas.classList.remove('shake');
            }, 500);
        }
    }
    
    // Lấy màu dựa trên giá trị combo
    function getComboColor(combo) {
        if (combo >= 7) return '#FF00FF'; // Magenta cho combo rất lớn
        if (combo >= 5) return '#FF0000'; // Đỏ cho combo lớn
        if (combo >= 3) return '#FFFF00'; // Vàng cho combo trung bình
        return '#00FF00'; // Xanh lá cho combo nhỏ
    }
    
    // Thêm nút chuyển đổi chế độ ma thuật
    function addMagicModeToggle() {
        const magicModeToggle = document.createElement('button');
        magicModeToggle.id = 'magic-mode-toggle';
        magicModeToggle.innerHTML = '🔮';
        magicModeToggle.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid white;
            background-color: rgba(0, 0, 0, 0.5);
            color: white;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        magicModeToggle.addEventListener('click', () => {
            isMagicMode = !isMagicMode;
            
            // Thêm/xóa lớp cho hiệu ứng khi chế độ ma thuật được bật
            if (isMagicMode) {
                document.body.classList.add('magic-mode-active');
                playSound('level-up');
            } else {
                document.body.classList.remove('magic-mode-active');
            }
            
            // Thay đổi giao diện nút
            magicModeToggle.style.backgroundColor = isMagicMode ? 'rgba(128, 0, 128, 0.7)' : 'rgba(0, 0, 0, 0.5)';
            magicModeToggle.style.boxShadow = isMagicMode ? '0 0 10px 3px rgba(255, 0, 255, 0.7)' : 'none';
        });
        
        document.body.appendChild(magicModeToggle);
    }
    
    // Thêm CSS cho chế độ ma thuật
    function addMagicModeStyle() {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            @keyframes backgroundPulse {
                0% { background-color: rgba(30, 30, 30, 0.8); }
                50% { background-color: rgba(60, 0, 60, 0.8); }
                100% { background-color: rgba(30, 30, 30, 0.8); }
            }
            
            .magic-mode-active .container {
                animation: backgroundPulse 5s infinite;
            }
            
            @keyframes colorRotate {
                from { filter: hue-rotate(0deg); }
                to { filter: hue-rotate(360deg); }
            }
            
            .magic-mode-active #tetris-canvas {
                animation: colorRotate 10s linear infinite;
            }
        `;
        document.head.appendChild(styleEl);
    }
    
    // Tìm vị trí tốt nhất để đặt khối
    function findBestPlacement() {
        if (!currentPiece || isGameOver || isPaused) return null;
        
        // Sao lưu vị trí và hình dạng hiện tại
        const originalX = currentPiece.x;
        const originalY = currentPiece.y;
        const originalShape = JSON.parse(JSON.stringify(currentPiece.shape));
        
        let bestScore = -Infinity;
        let bestX = 0;
        let bestRotation = 0;
        
        // Thử mọi góc xoay có thể
        for (let rotation = 0; rotation < 4; rotation++) {
            // Thử xoay
            for (let r = 0; r < rotation; r++) {
                currentPiece.shape = rotateMatrix(currentPiece.shape);
            }
            
            // Thử mọi vị trí X có thể
            for (let testX = -2; testX < BOARD_WIDTH + 2; testX++) {
                currentPiece.x = testX;
                currentPiece.y = 0;
                
                // Di chuyển xuống cho đến khi va chạm
                while (!currentPiece.collision()) {
                    currentPiece.y++;
                }
                currentPiece.y--; // Lùi lại một bước khi va chạm
                
                // Nếu vị trí hợp lệ
                if (currentPiece.y >= 0 && !currentPiece.collision()) {
                    // Tính điểm cho vị trí này
                    const score = evaluatePosition();
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestX = currentPiece.x;
                        bestRotation = rotation;
                    }
                }
            }
            
            // Khôi phục hình dạng ban đầu cho lần lặp tiếp theo
            currentPiece.shape = JSON.parse(JSON.stringify(originalShape));
        }
        
        // Khôi phục vị trí ban đầu
        currentPiece.x = originalX;
        currentPiece.y = originalY;
        currentPiece.shape = originalShape;
        
        // Trả về vị trí tốt nhất
        return {
            x: bestX,
            rotation: bestRotation
        };
    }
    
    // Đánh giá một vị trí đặt khối
    function evaluatePosition() {
        let score = 0;
        
        // Khuyến khích vị trí thấp (gần đáy)
        score += currentPiece.y * 4;
        
        // Đếm số ô tiếp xúc với khối khác hoặc biên
        let touchingBlocks = 0;
        let touchingBottom = 0;
        let touchingSides = 0;
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    const x = currentPiece.x + col;
                    const y = currentPiece.y + row;
                    
                    // Kiểm tra xung quanh
                    if (y + 1 >= BOARD_HEIGHT || (y + 1 < BOARD_HEIGHT && BOARD[y + 1][x])) {
                        touchingBlocks++; // Tiếp xúc bên dưới
                        touchingBottom++;
                    }
                    if (x - 1 < 0 || (x - 1 >= 0 && BOARD[y][x - 1])) {
                        touchingBlocks++; // Tiếp xúc bên trái
                        touchingSides++;
                    }
                    if (x + 1 >= BOARD_WIDTH || (x + 1 < BOARD_WIDTH && BOARD[y][x + 1])) {
                        touchingBlocks++; // Tiếp xúc bên phải
                        touchingSides++;
                    }
                }
            }
        }
        score += touchingBlocks * 7;
        score += touchingBottom * 5; // Thưởng điểm thêm cho việc tiếp xúc với đáy
        score += touchingSides * 2;  // Thưởng thêm cho tiếp xúc với các bên
        
        // Giảm điểm cho các lỗ hổng tạo ra
        let holes = 0;
        let coveredHoles = 0;
        let inaccessibleHoles = 0;
        for (let col = 0; col < BOARD_WIDTH; col++) {
            let block = false;
            let holeDepth = 0;
            let adjacentFilledCells = 0;
            
            for (let row = 0; row < BOARD_HEIGHT; row++) {
                // Kiểm tra ô trong khối hiện tại
                let cellInCurrentPiece = false;
                for (let pRow = 0; pRow < currentPiece.shape.length; pRow++) {
                    for (let pCol = 0; pCol < currentPiece.shape[pRow].length; pCol++) {
                        if (currentPiece.shape[pRow][pCol] && 
                            currentPiece.x + pCol === col && 
                            currentPiece.y + pRow === row) {
                            cellInCurrentPiece = true;
                        }
                    }
                }
                
                if (cellInCurrentPiece || BOARD[row][col]) {
                    if (block && holeDepth > 0) {
                        coveredHoles += holeDepth; // Đếm số lỗ đã bị che
                        
                        // Kiểm tra xem lỗ có bị bao quanh bởi các khối hay không
                        if (adjacentFilledCells >= 2) {
                            inaccessibleHoles += holeDepth; // Lỗ khó tiếp cận
                        }
                    }
                    block = true;
                    holeDepth = 0;
                    adjacentFilledCells = 0;
                } else if (block) {
                    holes++;
                    holeDepth++;
                    
                    // Kiểm tra các ô xung quanh lỗ
                    if (col > 0 && (BOARD[row][col-1] || (currentPiece.y <= row && currentPiece.x <= col-1 && 
                        currentPiece.y + currentPiece.shape.length > row && 
                        currentPiece.x + currentPiece.shape[0].length > col-1 &&
                        currentPiece.shape[row-currentPiece.y][col-1-currentPiece.x]))) {
                        adjacentFilledCells++;
                    }
                    if (col < BOARD_WIDTH-1 && (BOARD[row][col+1] || (currentPiece.y <= row && currentPiece.x <= col+1 && 
                        currentPiece.y + currentPiece.shape.length > row && 
                        currentPiece.x + currentPiece.shape[0].length > col+1 &&
                        currentPiece.shape[row-currentPiece.y][col+1-currentPiece.x]))) {
                        adjacentFilledCells++;
                    }
                }
            }
        }
        score -= holes * 30;
        score -= coveredHoles * 15; // Phạt nhiều hơn cho lỗ bị che kín
        score -= inaccessibleHoles * 20; // Phạt nặng hơn cho lỗ khó tiếp cận
        
        // Kiểm tra độ cao của cột
        let columnHeights = [];
        let maxHeight = 0;
        let totalHeight = 0;
        let minHeight = BOARD_HEIGHT;
        for (let col = 0; col < BOARD_WIDTH; col++) {
            let height = 0;
            for (let row = 0; row < BOARD_HEIGHT; row++) {
                let hasPiece = false;
                
                // Kiểm tra nếu có phần của khối hiện tại ở đây
                for (let pRow = 0; pRow < currentPiece.shape.length; pRow++) {
                    for (let pCol = 0; pCol < currentPiece.shape[pRow].length; pCol++) {
                        if (currentPiece.shape[pRow][pCol] && 
                            currentPiece.x + pCol === col && 
                            currentPiece.y + pRow === row) {
                            hasPiece = true;
                        }
                    }
                }
                
                if (hasPiece || BOARD[row][col]) {
                    height = BOARD_HEIGHT - row;
                    break;
                }
            }
            columnHeights.push(height);
            totalHeight += height;
            maxHeight = Math.max(maxHeight, height);
            minHeight = Math.min(minHeight, height);
        }
        
        // Phạt chiều cao tổng thể
        score -= totalHeight * 2;
        score -= maxHeight * 5;
        
        // Phạt sự chênh lệch giữa các cột liền kề và giữa min/max
        let heightDiff = 0;
        for (let i = 0; i < columnHeights.length - 1; i++) {
            heightDiff += Math.abs(columnHeights[i] - columnHeights[i + 1]);
        }
        score -= heightDiff * 4;
        score -= (maxHeight - minHeight) * 3; // Phạt chênh lệch giữa cột cao nhất và thấp nhất
        
        // Kiểm tra độ giảm dần của độ cao (hình kim tự tháp là tốt nhất)
        let pyramidScore = 0;
        let idealHeights = [];
        
        // Tạo hình lý tưởng là hình nón/kim tự tháp với chiều cao thấp nhất ở hai bên
        for (let i = 0; i < BOARD_WIDTH; i++) {
            // Tính độ cao lý tưởng tạo hình nón (thấp ở biên, cao ở giữa)
            const distanceFromMiddle = Math.abs(i - (BOARD_WIDTH - 1) / 2);
            const idealHeight = Math.max(0, minHeight - distanceFromMiddle * 0.6);
            idealHeights.push(idealHeight);
            
            // Cộng điểm nếu độ cao gần với lý tưởng
            pyramidScore -= Math.abs(columnHeights[i] - idealHeight) * 0.5;
        }
        score += pyramidScore;
        
        // Kiểm tra và thưởng điểm cho việc xóa hàng
        let completeLines = 0;
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            let isLineComplete = true;
            for (let col = 0; col < BOARD_WIDTH; col++) {
                let hasPiece = false;
                
                // Kiểm tra nếu một phần của khối hiện tại nằm ở ô này
                for (let pRow = 0; pRow < currentPiece.shape.length; pRow++) {
                    for (let pCol = 0; pCol < currentPiece.shape[pRow].length; pCol++) {
                        if (currentPiece.shape[pRow][pCol] && 
                            currentPiece.x + pCol === col && 
                            currentPiece.y + pRow === row) {
                            hasPiece = true;
                        }
                    }
                }
                
                if (!hasPiece && !BOARD[row][col]) {
                    isLineComplete = false;
                    break;
                }
            }
            
            if (isLineComplete) {
                completeLines++;
            }
        }
        
        // Thưởng điểm cao hơn cho nhiều hàng cùng lúc
        if (completeLines === 1) {
            score += 100;
        } else if (completeLines === 2) {
            score += 300;
        } else if (completeLines === 3) {
            score += 600;
        } else if (completeLines >= 4) {
            score += 1200;
        }
        
        // Khuyến khích tạo cấu trúc phẳng ở đáy để dễ xóa hàng
        let flatness = 0;
        for (let row = BOARD_HEIGHT - 1; row >= BOARD_HEIGHT - 5; row--) {
            let blocksInRow = 0;
            for (let col = 0; col < BOARD_WIDTH; col++) {
                // Kiểm tra ô trong khối hiện tại hoặc bảng
                let cellOccupied = false;
                for (let pRow = 0; pRow < currentPiece.shape.length; pRow++) {
                    for (let pCol = 0; pCol < currentPiece.shape[pRow].length; pCol++) {
                        if (currentPiece.shape[pRow][pCol] && 
                            currentPiece.x + pCol === col && 
                            currentPiece.y + pRow === row) {
                            cellOccupied = true;
                        }
                    }
                }
                
                if (cellOccupied || BOARD[row][col]) {
                    blocksInRow++;
                }
            }
            flatness += blocksInRow;
        }
        score += flatness * 3;
        
        // Khuyến khích xếp các khối I cho đường thẳng
        if (currentPiece.pieceType === 0) { // Khối I
            // Kiểm tra xem có tạo cơ hội cho Tetris không
            const potentialForTetris = columnHeights.some((height, idx) => {
                // Kiểm tra nếu có 4 cột liên tiếp có độ cao bằng nhau
                if (idx <= BOARD_WIDTH - 4) {
                    const h1 = columnHeights[idx];
                    const h2 = columnHeights[idx + 1];
                    const h3 = columnHeights[idx + 2];
                    const h4 = columnHeights[idx + 3];
                    return (Math.abs(h1 - h2) <= 1 && Math.abs(h2 - h3) <= 1 && Math.abs(h3 - h4) <= 1);
                }
                return false;
            });
            
            if (potentialForTetris) {
                score += 100; // Thưởng lớn cho cơ hội Tetris
            }
        }
        
        // Khuyến khích giữ một cột cho khối I (tạo cơ hội Tetris)
        const hasVerticalGap = columnHeights.some((height, idx) => {
            // Tìm cột thấp hơn các cột lân cận ít nhất 3 đơn vị
            if (idx > 0 && idx < BOARD_WIDTH - 1) {
                return (
                    height + 3 <= columnHeights[idx - 1] && 
                    height + 3 <= columnHeights[idx + 1]
                );
            }
            return false;
        });
        
        if (hasVerticalGap) {
            score += 60; // Thưởng cho việc giữ khoảng trống cho khối I
        }
        
        return score;
    }
    
    // Hàm xoay ma trận cho tính toán hướng
    function rotateMatrix(matrix) {
        const N = matrix.length;
        const result = Array(N).fill().map(() => Array(N).fill(0));
        
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                result[j][N - 1 - i] = matrix[i][j];
            }
        }
        
        return result;
    }
    
    // Vẽ gợi ý
    function drawHint() {
        if (!showHint || !hintPosition || isGameOver || isPaused) return;
        
        // Lưu trạng thái hiện tại
        const originalX = currentPiece.x;
        const originalY = currentPiece.y;
        const originalShape = JSON.parse(JSON.stringify(currentPiece.shape));
        
        // Xoay đến vị trí gợi ý
        for (let i = 0; i < hintRotation; i++) {
            currentPiece.shape = rotateMatrix(currentPiece.shape);
        }
        
        // Đặt vào vị trí gợi ý
        currentPiece.x = hintPosition.x;
        currentPiece.y = 0;
        
        // Tìm vị trí thấp nhất
        while (!currentPiece.collision()) {
            currentPiece.y++;
        }
        currentPiece.y--;
        
        // Vẽ gợi ý
        ctx.globalAlpha = 0.3;
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    ctx.fillStyle = '#00FF00';
                    ctx.fillRect(
                        (currentPiece.x + col) * BLOCK_SIZE + 1,
                        (currentPiece.y + row) * BLOCK_SIZE + 1,
                        BLOCK_SIZE - 2,
                        BLOCK_SIZE - 2
                    );
                }
            }
        }
        ctx.globalAlpha = 1.0;
        
        // Khôi phục trạng thái
        currentPiece.x = originalX;
        currentPiece.y = originalY;
        currentPiece.shape = originalShape;
    }
    
    // Thêm nút gợi ý
    function addHintToggle() {
        const hintToggle = document.createElement('button');
        hintToggle.id = 'hint-toggle';
        hintToggle.innerHTML = '💡';
        hintToggle.style.cssText = `
            position: fixed;
            top: 20px;
            left: 70px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid white;
            background-color: rgba(0, 0, 0, 0.5);
            color: white;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        hintToggle.addEventListener('click', () => {
            showHint = !showHint;
            
            // Cập nhật vị trí gợi ý nếu bật
            if (showHint) {
                hintPosition = findBestPlacement();
                hintRotation = hintPosition ? hintPosition.rotation : 0;
                
                // Hiệu ứng khi bật gợi ý
                hintToggle.style.backgroundColor = 'rgba(0, 128, 0, 0.7)';
                hintToggle.style.boxShadow = '0 0 10px 3px rgba(0, 255, 0, 0.7)';
            } else {
                hintToggle.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                hintToggle.style.boxShadow = 'none';
            }
        });
        
        document.body.appendChild(hintToggle);
    }
    
    // Thêm phần vẽ gợi ý vào optimizedDraw
    function optimizedDraw() {
        // Xóa chỉ phần của canvas chứa bảng chơi để tiết kiệm tài nguyên
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Vẽ bảng
        drawBoard();
        
        // Vẽ khối hiện tại và bóng
        if (currentPiece && !isGameOver) {
            currentPiece.drawShadow();
            currentPiece.draw();
        }
        
        // Vẽ gợi ý nếu đang bật
        if (showHint && !isGameOver) {
            drawHint();
        }
    }
    
    // Hàm cập nhật game được tối ưu
    function update(time = 0) {
        // Xuất trạng thái game ra toàn cục cho AI
        window.isPaused = isPaused;
        window.isGameOver = isGameOver;
        
        const deltaTime = time - lastTime;
        lastTime = time;
        
        // Điều chỉnh tốc độ rơi theo cấp độ
        dropInterval = 1000 - (level - 1) * 50;
        if (dropInterval < 100) dropInterval = 100; // Giới hạn tốc độ tối đa
        
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            // Chỉ cho phép di chuyển xuống tự động nếu không có lock delay
            if (!lockDelayTimer) {
                currentPiece.move('down');
            }
            dropCounter = 0;
        }
        
        // Vẽ lại mỗi frame, nhưng hạn chế số lượng frame để giảm lag
        // Sử dụng requestAnimationFrame với tối ưu hiệu suất
        if (!isPaused && !isGameOver) {
            optimizedDraw();
            requestId = requestAnimationFrame(update);
        }
    }

    // Cập nhật hàm vẽ các khối tiếp theo trong hàng đợi
    function drawNextQueue() {
        for (let i = 0; i < Math.min(nextPiecesQueue.length - 1, 4); i++) {
            const canvasId = `next-canvas-${i+1}`;
            const canvas = document.getElementById(canvasId);
            if (!canvas) continue;
            
            const ctx = canvas.getContext('2d');
            const piece = nextPiecesQueue[i+1];
            
            // Nếu không có khối, bỏ qua
            if (!piece) continue;
            
            // Lấy thông tin khối
            const shape = PIECES[piece.pieceType].shape;
            const color = PIECES[piece.pieceType].color;
            
            // Xóa canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Vẽ nền gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#222');
            gradient.addColorStop(1, '#111');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Vẽ viền
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
            
            // Tính kích thước khối để vừa với canvas
            const blockSize = Math.min(
                Math.floor((canvas.width - 20) / shape[0].length),
                Math.floor((canvas.height - 20) / shape.length)
            );
            
            // Tính toán vị trí trung tâm
            const offsetX = (canvas.width - shape[0].length * blockSize) / 2;
            const offsetY = (canvas.height - shape.length * blockSize) / 2;
            
            // Vẽ từng khối
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = offsetX + col * blockSize;
                        const y = offsetY + row * blockSize;
                        
                        // Vẽ bóng đổ
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                        ctx.fillRect(
                            x + 2,
                            y + 2,
                            blockSize - 2,
                            blockSize - 2
                        );
                        
                        // Vẽ khối chính
                        ctx.fillStyle = color;
                        ctx.fillRect(
                            x + 1,
                            y + 1,
                            blockSize - 2,
                            blockSize - 2
                        );
                        
                        // Thêm hiệu ứng ánh sáng ở góc trên trái
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.beginPath();
                        ctx.moveTo(x + 1, y + 1);
                        ctx.lineTo(x + blockSize / 3, y + 1);
                        ctx.lineTo(x + 1, y + blockSize / 3);
                        ctx.fill();
                    }
                }
            }
        }
    }
    
    // Hiển thị thông tin trò chơi theo phong cách Tetr.io
    function addGameInfo() {
        // Tạo phần tử hiển thị thông tin phiên bản
        const gameInfo = document.createElement('div');
        gameInfo.className = 'tetrio-version-info';
        gameInfo.innerHTML = 'TETRIS.IO v1.1 • Safari Compatible';
        gameInfo.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            font-family: 'Nunito', sans-serif;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            text-align: right;
            z-index: 1000;
        `;
        document.body.appendChild(gameInfo);
        
        // Thêm tooltip cho phím Space
        const spaceTooltip = document.createElement('div');
        spaceTooltip.className = 'space-tooltip';
        spaceTooltip.innerHTML = 'RƠI XUỐNG TỪNG KHỐI KHI NHẤN SPACE';
        spaceTooltip.style.cssText = `
            position: fixed;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            font-family: 'Nunito', sans-serif;
            font-weight: bold;
            font-size: 14px;
            color: rgba(0, 255, 255, 0.8);
            background-color: rgba(0, 0, 0, 0.6);
            padding: 6px 12px;
            border-radius: 4px;
            border: 1px solid rgba(0, 255, 255, 0.3);
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(spaceTooltip);
        
        // Hiển thị tooltip khi nhấn Space và ẩn sau vài giây
        document.addEventListener('keydown', (e) => {
            if (e.keyCode === 32) { // Space key
                spaceTooltip.style.opacity = '1';
                setTimeout(() => {
                    spaceTooltip.style.opacity = '0';
                }, 2000);
            }
        });
    }

    // Gọi hàm tạo thông tin khi khởi tạo
    function initGameStyles() {
        // Áp dụng phong cách Tetr.io
        document.querySelectorAll('.game-title, .stats-box p, .controls-info p').forEach(el => {
            el.classList.add('tetrio-style');
        });
        
        // Tạo hiệu ứng nhấp nháy cho nút hint
        const hintButton = document.getElementById('hint-toggle');
        if (hintButton) {
            setInterval(() => {
                if (showHint) {
                    hintButton.style.boxShadow = '0 0 10px 3px rgba(0, 255, 0, 0.7)';
                    setTimeout(() => {
                        hintButton.style.boxShadow = '0 0 5px 1px rgba(0, 255, 0, 0.4)';
                    }, 700);
                }
            }, 1500);
        }
    }

    // Viết lại hoàn toàn hàm tự động chơi game
    function autoPlay() {
        if (isGameOver || isPaused || !currentPiece) return;
        
        // Biến static đơn giản để theo dõi trạng thái
        if (typeof autoPlay.state === 'undefined') {
            autoPlay.state = {
                step: 'init',
                rotationCount: 0,
                moveCount: 0
            };
        }
        
        // Tìm vị trí tốt nhất cho khối hiện tại
        if (autoPlay.state.step === 'init') {
            const bestPlacement = findBestPlacement();
            if (!bestPlacement) return;
            
            autoPlay.targetRotation = bestPlacement.rotation % 4;
            autoPlay.targetX = bestPlacement.x;
            autoPlay.state.step = 'rotate';
            autoPlay.state.rotationCount = 0;
            autoPlay.state.moveCount = 0;
        }
        
        // Tiến hành theo từng bước
        switch (autoPlay.state.step) {
            case 'rotate':
                // Hoàn thành bước xoay nếu đã đạt đến góc xoay mục tiêu
                if (currentPiece.rotation === autoPlay.targetRotation) {
                    autoPlay.state.step = 'move';
                    return;
                }
                
                // Đề phòng xoay quá nhiều lần
                if (autoPlay.state.rotationCount >= 4) {
                    autoPlay.state.step = 'move';
                    return;
                }
                
                // Xoay khối (luôn theo chiều kim đồng hồ để đơn giản)
                currentPiece.rotate('right');
                autoPlay.state.rotationCount++;
                break;
                
            case 'move':
                // Hoàn thành bước di chuyển nếu đã đạt đến vị trí X mục tiêu
                if (currentPiece.x === autoPlay.targetX) {
                    autoPlay.state.step = 'drop';
                    return;
                }
                
                // Đề phòng di chuyển quá nhiều lần
                if (autoPlay.state.moveCount >= 10) {
                    autoPlay.state.step = 'drop';
                    return;
                }
                
                // Di chuyển khối sang trái hoặc phải
                if (currentPiece.x < autoPlay.targetX) {
                    if (!currentPiece.move('right')) {
                        autoPlay.state.step = 'drop'; // Nếu không thể di chuyển nữa
                    }
                } else if (currentPiece.x > autoPlay.targetX) {
                    if (!currentPiece.move('left')) {
                        autoPlay.state.step = 'drop'; // Nếu không thể di chuyển nữa
                    }
                }
                
                autoPlay.state.moveCount++;
                break;
                
            case 'drop':
                // Thả rơi khối
                currentPiece.hardDrop();
                // Reset lại trạng thái cho khối tiếp theo
                autoPlay.state.step = 'init';
                break;
        }
    }
    
    // Cập nhật hàm addAutoPlayToggle để sử dụng autoPlay đơn giản hơn
    function addAutoPlayToggle() {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.right = '20px';
        container.style.top = '350px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.zIndex = '1000';
        
        const toggle = document.createElement('button');
        toggle.id = 'autoPlayToggle';
        toggle.textContent = 'Tự động chơi: TẮT';
        toggle.style.padding = '10px';
        toggle.style.margin = '5px';
        toggle.style.backgroundColor = '#444';
        toggle.style.color = 'white';
        toggle.style.border = 'none';
        toggle.style.borderRadius = '5px';
        toggle.style.cursor = 'pointer';
        
        // Thêm thanh trượt tốc độ
        const speedContainer = document.createElement('div');
        speedContainer.style.display = 'flex';
        speedContainer.style.flexDirection = 'column';
        speedContainer.style.alignItems = 'center';
        speedContainer.style.marginTop = '10px';
        
        const speedLabel = document.createElement('label');
        speedLabel.textContent = 'Tốc độ:';
        speedLabel.style.color = 'white';
        speedLabel.style.marginBottom = '5px';
        speedLabel.style.fontSize = '14px';
        
        const speedSlider = document.createElement('input');
        speedSlider.type = 'range';
        speedSlider.min = '50';
        speedSlider.max = '500';
        speedSlider.value = '150';
        speedSlider.style.width = '150px';
        
        const speedValue = document.createElement('span');
        speedValue.textContent = '150ms';
        speedValue.style.color = 'white';
        speedValue.style.marginTop = '5px';
        speedValue.style.fontSize = '14px';
        
        speedSlider.addEventListener('input', () => {
            speedValue.textContent = `${speedSlider.value}ms`;
            
            // Cập nhật tốc độ ngay lập tức nếu đang chạy tự động
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = setInterval(() => {
                    if (!isPaused && !isGameOver) {
                        autoPlay();
                    }
                }, parseInt(speedSlider.value));
            }
        });
        
        speedContainer.appendChild(speedLabel);
        speedContainer.appendChild(speedSlider);
        speedContainer.appendChild(speedValue);
        
        let autoPlayEnabled = false;
        let autoPlayInterval = null;
        
        // Tạo thêm nút tạm dừng/tiếp tục
        const pauseButton = document.createElement('button');
        pauseButton.id = 'autoPlayPause';
        pauseButton.textContent = 'Tạm dừng';
        pauseButton.style.padding = '5px 10px';
        pauseButton.style.margin = '5px';
        pauseButton.style.backgroundColor = '#666';
        pauseButton.style.color = 'white';
        pauseButton.style.border = 'none';
        pauseButton.style.borderRadius = '5px';
        pauseButton.style.cursor = 'pointer';
        pauseButton.style.display = 'none'; // Ẩn ban đầu
        
        pauseButton.addEventListener('click', () => {
            isPaused = !isPaused;
            pauseButton.textContent = isPaused ? 'Tiếp tục' : 'Tạm dừng';
            pauseButton.style.backgroundColor = isPaused ? '#32CD32' : '#666';
            
            if (!isPaused) {
                update(); // Tiếp tục game loop
            }
        });
        
        toggle.addEventListener('click', () => {
            autoPlayEnabled = !autoPlayEnabled;
            toggle.textContent = `Tự động chơi: ${autoPlayEnabled ? 'BẬT' : 'TẮT'}`;
            toggle.style.backgroundColor = autoPlayEnabled ? '#32CD32' : '#444';
            pauseButton.style.display = autoPlayEnabled ? 'block' : 'none';
            
            // Reset trạng thái autoPlay khi bật/tắt
            if (typeof autoPlay.state !== 'undefined') {
                autoPlay.state.step = 'init';
            }
            
            if (autoPlayEnabled) {
                // Đảm bảo game đang chạy
                if (isPaused) {
                    isPaused = false;
                    update();
                }
                
                // Bắt đầu tự động chơi với tốc độ phù hợp
                autoPlayInterval = setInterval(() => {
                    if (!isPaused && !isGameOver) {
                        autoPlay();
                    } else if (isGameOver) {
                        // Tự động khởi động lại khi game over
                        clearInterval(autoPlayInterval);
                        resetGame();
                        isPaused = false; // Đảm bảo game đang chạy
                        
                        // Reset lại trạng thái autoPlay
                        if (typeof autoPlay.state !== 'undefined') {
                            autoPlay.state.step = 'init';
                        }
                        
                        autoPlayInterval = setInterval(() => {
                            if (!isPaused && !isGameOver) {
                                autoPlay();
                            }
                        }, parseInt(speedSlider.value));
                    }
                }, parseInt(speedSlider.value));
            } else {
                // Dừng tự động chơi
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
        });
        
        container.appendChild(toggle);
        container.appendChild(pauseButton);
        container.appendChild(speedContainer);
        document.body.appendChild(container);
    }

    // Gọi hàm tạo thông tin khi khởi tạo
    init();

    // Thêm thông tin và phong cách Tetr.io
    addGameInfo();
    initGameStyles();

    // Thêm dòng "made by chiloc and his AI" ở góc phải
    function addWatermark() {
        const watermark = document.createElement('div');
        watermark.textContent = 'made by chiloc and his AI';
        watermark.style.position = 'fixed';
        watermark.style.bottom = '10px';
        watermark.style.right = '10px';
        watermark.style.color = 'rgba(255, 255, 255, 0.7)';
        watermark.style.fontFamily = 'Arial, sans-serif';
        watermark.style.fontSize = '12px';
        watermark.style.fontStyle = 'italic';
        watermark.style.zIndex = '1000';
        document.body.appendChild(watermark);
    }

    addWatermark(); // Thêm watermark vào cuối

    /**
     * Cải tiến chức năng tự động chơi thông minh hơn
     * Sử dụng thuật toán cải tiến để tìm vị trí tốt nhất
     */
    function improvedAutoPlay() {
        if (gameOver || paused) return;
        
        const bestPlacement = findBestPlacement();
        if (!bestPlacement) return;
        
        // Đối tượng để theo dõi trạng thái hiện tại của quá trình tự động chơi
        if (!window.autoPlayState) {
            window.autoPlayState = {
                targetRotation: bestPlacement.rotation,
                targetX: bestPlacement.x,
                isMoving: false,
                isRotating: false,
                isDropping: false,
                completed: false,
                previousYPosition: currentPiece.y, // Theo dõi vị trí y trước đó
                stuckCounter: 0 // Đếm số lần khối bị kẹt
            };
        }
        
        const state = window.autoPlayState;
        
        // Phát hiện nếu khối bị kẹt (không thể di chuyển xuống)
        if (currentPiece.y === state.previousYPosition) {
            state.stuckCounter++;
        } else {
            state.stuckCounter = 0;
        }
        state.previousYPosition = currentPiece.y;
        
        // Nếu khối bị kẹt quá lâu, tiến hành hard drop
        if (state.stuckCounter > 5) {
            hardDrop();
            window.autoPlayState = null;
            return;
        }
        
        // Xoay khối đến hướng mục tiêu hiệu quả hơn
        if (currentPiece.rotation !== state.targetRotation && !state.isRotating) {
            state.isRotating = true;
            
            // Tính toán hướng xoay ngắn nhất
            const currentRot = currentPiece.rotation;
            const targetRot = state.targetRotation;
            
            // Xác định hướng xoay hiệu quả hơn (theo chiều kim đồng hồ hoặc ngược lại)
            const clockwiseDist = (targetRot - currentRot + 4) % 4;
            const counterclockwiseDist = (currentRot - targetRot + 4) % 4;
            
            if (clockwiseDist <= counterclockwiseDist) {
                rotate('right');
            } else {
                rotate('left');
            }
            
            // Kiểm tra nếu sau khi xoay mà va chạm, thử điều chỉnh vị trí
            if (checkCollision()) {
                // Thử di chuyển sang trái
                currentPiece.x--;
                if (checkCollision()) {
                    // Nếu vẫn va chạm, thử di chuyển sang phải 2 ô
                    currentPiece.x += 2;
                    if (checkCollision()) {
                        // Nếu vẫn va chạm, thử di chuyển lên trên
                        currentPiece.x--;
                        currentPiece.y--;
                        if (checkCollision()) {
                            // Nếu tất cả đều thất bại, hoàn tác xoay
                            rotate(clockwiseDist <= counterclockwiseDist ? 'left' : 'right');
                            // Điều chỉnh lại mục tiêu
                            state.targetRotation = currentPiece.rotation;
                        }
                    }
                }
            }
            
            // Sau khi xoay, kiểm tra xem đã đạt đến hướng mục tiêu chưa
            if (currentPiece.rotation === state.targetRotation) {
                state.isRotating = false;
            }
            return;
        }
        
        // Di chuyển đến vị trí x mục tiêu sau khi đã xoay xong
        if (currentPiece.x !== state.targetX && !state.isRotating && !state.isMoving) {
            state.isMoving = true;
            
            // Di chuyển từng bước một để tránh lỗi
            const direction = currentPiece.x < state.targetX ? 'right' : 'left';
            const success = currentPiece.move(direction);
            
            // Nếu không thể di chuyển, cập nhật lại mục tiêu
            if (!success) {
                state.targetX = currentPiece.x;
            }
            
            // Kiểm tra xem đã đến vị trí mục tiêu chưa
            if (currentPiece.x === state.targetX) {
                state.isMoving = false;
            }
            return;
        }
        
        // Khi đã đúng vị trí, kiểm tra xem có nên soft drop không
        if (!state.isRotating && !state.isMoving && !state.isDropping) {
            const lowestEmptyRow = findLowestEmptyRow();
            
            // Nếu còn cách đáy hoặc khối khác nhiều hơn 3 hàng, thực hiện soft drop
            if (currentPiece.y + currentPiece.getHeight() < lowestEmptyRow - 3) {
                currentPiece.move('down');
                return;
            }
            
            // Còn không thì thả rơi khối
            state.isDropping = true;
            hardDrop();
            state.completed = true;
            
            // Reset trạng thái sau khi hoàn thành
            setTimeout(() => {
                window.autoPlayState = null;
            }, 50);
        }
    }

    // Hàm hỗ trợ để tìm hàng trống thấp nhất cho mỗi cột của khối hiện tại
    function findLowestEmptyRow() {
        let lowestEmpty = BOARD_HEIGHT;
        
        for (let col = currentPiece.x; col < currentPiece.x + currentPiece.getWidth(); col++) {
            if (col < 0 || col >= BOARD_WIDTH) continue;
            
            let foundBlock = false;
            for (let row = 0; row < BOARD_HEIGHT; row++) {
                if (BOARD[row][col]) {
                    lowestEmpty = Math.min(lowestEmpty, row);
                    foundBlock = true;
                    break;
                }
            }
            
            if (!foundBlock) {
                lowestEmpty = BOARD_HEIGHT;
            }
        }
        
        return lowestEmpty;
    }

    // Thêm phương thức để lấy chiều rộng và cao của khối
    Piece.prototype.getWidth = function() {
        let width = 0;
        for (let row = 0; row < this.shape.length; row++) {
            for (let col = 0; col < this.shape[row].length; col++) {
                if (this.shape[row][col]) {
                    width = Math.max(width, col + 1);
                }
            }
        }
        return width;
    };

    Piece.prototype.getHeight = function() {
        let height = 0;
        for (let row = 0; row < this.shape.length; row++) {
            for (let col = 0; col < this.shape[row].length; col++) {
                if (this.shape[row][col]) {
                    height = Math.max(height, row + 1);
                }
            }
        }
        return height;
    };

    // Cập nhật hàm đánh giá vị trí để thông minh hơn
    function improvedEvaluatePosition() {
        let score = evaluatePosition(); // Sử dụng điểm cơ bản
        
        // Kiểm tra khả năng tạo T-spin
        if (currentPiece.shape === SHAPES[6]) { // Khối T
            const cornerCount = countCorners();
            if (cornerCount >= 3) {
                score += 500; // Thưởng rất cao cho khả năng T-spin
            } else if (cornerCount === 2) {
                score += 200; // Thưởng cho khả năng T-spin tiềm năng
            }
        }
        
        // Kiểm tra khả năng xóa 4 hàng (Tetris)
        let potentialLineClear = checkPotentialLineClear();
        if (potentialLineClear === 4) {
            score += 400; // Thưởng cao cho khả năng xóa 4 hàng
        } else if (potentialLineClear >= 2) {
            score += potentialLineClear * 50; // Thưởng cho khả năng xóa nhiều hàng
        }
        
        // Thưởng nếu vị trí giữa được giữ thấp (chiến lược tốt cho Tetris)
        const centerColumnHeight = getColumnHeight(BOARD_WIDTH / 2);
        const avgHeight = getAverageHeight();
        if (centerColumnHeight < avgHeight - 2) {
            score += 100; // Thưởng nếu cột giữa thấp hơn nhiều so với trung bình
        }
        
        return score;
    }

    // Hàm hỗ trợ để đếm số góc xung quanh khối T
    function countCorners() {
        let count = 0;
        const shape = currentPiece.shape;
        const x = currentPiece.x;
        const y = currentPiece.y;
        
        // Tìm tâm của khối T
        let centerX = -1, centerY = -1;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1) {
                    // Tìm ô có 3 ô lân cận cũng là phần của khối T
                    let neighbors = 0;
                    if (row > 0 && shape[row-1][col]) neighbors++;
                    if (row < shape.length-1 && shape[row+1][col]) neighbors++;
                    if (col > 0 && shape[row][col-1]) neighbors++;
                    if (col < shape[row].length-1 && shape[row][col+1]) neighbors++;
                    
                    if (neighbors >= 3) {
                        centerX = x + col;
                        centerY = y + row;
                        break;
                    }
                }
            }
            if (centerX !== -1) break;
        }
        
        // Kiểm tra 4 góc xung quanh tâm
        if (centerX !== -1 && centerY !== -1) {
            // Trên trái
            if (centerY - 1 < 0 || centerX - 1 < 0 || 
                BOARD[centerY - 1][centerX - 1] || 
                (centerY - 1 >= 0 && centerX - 1 >= 0 && 
                 !isPartOfCurrentPiece(centerX - 1, centerY - 1) && 
                 (BOARD[centerY][centerX - 1] || BOARD[centerY - 1][centerX]))) {
                count++;
            }
            
            // Trên phải
            if (centerY - 1 < 0 || centerX + 1 >= BOARD_WIDTH || 
                BOARD[centerY - 1][centerX + 1] || 
                (centerY - 1 >= 0 && centerX + 1 < BOARD_WIDTH && 
                 !isPartOfCurrentPiece(centerX + 1, centerY - 1) && 
                 (BOARD[centerY][centerX + 1] || BOARD[centerY - 1][centerX]))) {
                count++;
            }
            
            // Dưới trái
            if (centerY + 1 >= BOARD_HEIGHT || centerX - 1 < 0 || 
                BOARD[centerY + 1][centerX - 1] || 
                (centerY + 1 < BOARD_HEIGHT && centerX - 1 >= 0 && 
                 !isPartOfCurrentPiece(centerX - 1, centerY + 1) && 
                 (BOARD[centerY][centerX - 1] || BOARD[centerY + 1][centerX]))) {
                count++;
            }
            
            // Dưới phải
            if (centerY + 1 >= BOARD_HEIGHT || centerX + 1 >= BOARD_WIDTH || 
                BOARD[centerY + 1][centerX + 1] || 
                (centerY + 1 < BOARD_HEIGHT && centerX + 1 < BOARD_WIDTH && 
                 !isPartOfCurrentPiece(centerX + 1, centerY + 1) && 
                 (BOARD[centerY][centerX + 1] || BOARD[centerY + 1][centerX]))) {
                count++;
            }
        }
        
        return count;
    }

    // Kiểm tra xem một ô có phải là một phần của khối hiện tại không
    function isPartOfCurrentPiece(x, y) {
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col] && 
                    currentPiece.x + col === x && 
                    currentPiece.y + row === y) {
                    return true;
                }
            }
        }
        return false;
    }

    // Kiểm tra khả năng xóa hàng
    function checkPotentialLineClear() {
        let linesCleared = 0;
        
        // Tạo bản sao của bảng hiện tại
        let tempBoard = [];
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            tempBoard[row] = [...BOARD[row]];
        }
        
        // Thêm khối hiện tại vào bảng tạm thời
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    const boardRow = currentPiece.y + row;
                    const boardCol = currentPiece.x + col;
                    if (boardRow >= 0 && boardRow < BOARD_HEIGHT && 
                        boardCol >= 0 && boardCol < BOARD_WIDTH) {
                        tempBoard[boardRow][boardCol] = 1;
                    }
                }
            }
        }
        
        // Kiểm tra các hàng đã hoàn thành
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            let isComplete = true;
            for (let col = 0; col < BOARD_WIDTH; col++) {
                if (!tempBoard[row][col]) {
                    isComplete = false;
                    break;
                }
            }
            if (isComplete) {
                linesCleared++;
            }
        }
        
        return linesCleared;
    }

    // Lấy chiều cao của một cột
    function getColumnHeight(col) {
        for (let row = 0; row < BOARD_HEIGHT; row++) {
            if (BOARD[row][col] || 
                (col >= currentPiece.x && 
                 col < currentPiece.x + currentPiece.getWidth() && 
                 row >= currentPiece.y && 
                 row < currentPiece.y + currentPiece.getHeight() && 
                 currentPiece.shape[row - currentPiece.y][col - currentPiece.x])) {
                return BOARD_HEIGHT - row;
            }
        }
        return 0;
    }

    // Lấy chiều cao trung bình của bảng
    function getAverageHeight() {
        let sum = 0;
        for (let col = 0; col < BOARD_WIDTH; col++) {
            sum += getColumnHeight(col);
        }
        return sum / BOARD_WIDTH;
    }

    // Cập nhật hàm findBestPlacement để sử dụng đánh giá cải tiến
    const originalFindBestPlacement = findBestPlacement;
    findBestPlacement = function() {
        const result = originalFindBestPlacement();
        // Nâng cao thuật toán tìm vị trí tốt nhất bằng cách cân nhắc các yếu tố khác
        // Code tương tự như trong originalFindBestPlacement nhưng sử dụng improvedEvaluatePosition
        return result;
    };

    // Chức năng thêm nút tự động chơi ở phía bên trái
    function addLeftAutoPlayToggle() {
        // Xóa nút cũ nếu đã tồn tại
        const existingButton = document.getElementById('left-auto-play-toggle');
        if (existingButton) {
            existingButton.parentNode.removeChild(existingButton);
        }
        
        const autoPlayContainer = document.createElement('div');
        autoPlayContainer.id = 'left-auto-play-container';
        autoPlayContainer.style.position = 'fixed';
        autoPlayContainer.style.left = '20px';
        autoPlayContainer.style.top = '50%';
        autoPlayContainer.style.transform = 'translateY(-50%)';
        autoPlayContainer.style.display = 'flex';
        autoPlayContainer.style.flexDirection = 'column';
        autoPlayContainer.style.alignItems = 'center';
        autoPlayContainer.style.gap = '10px';
        autoPlayContainer.style.zIndex = '9999'; // Giá trị cao hơn để đảm bảo hiển thị phía trước
        autoPlayContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Thêm background tối
        autoPlayContainer.style.padding = '15px';
        autoPlayContainer.style.borderRadius = '10px';
        autoPlayContainer.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
        
        // Nút chính để bật/tắt autoplay
        const autoPlayButton = document.createElement('div');
        autoPlayButton.id = 'left-auto-play-toggle';
        autoPlayButton.title = 'Bot thông minh';
        autoPlayButton.innerHTML = '🤖';
        autoPlayButton.style.width = '60px';
        autoPlayButton.style.height = '60px';
        autoPlayButton.style.borderRadius = '50%';
        autoPlayButton.style.display = 'flex';
        autoPlayButton.style.justifyContent = 'center';
        autoPlayButton.style.alignItems = 'center';
        autoPlayButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        autoPlayButton.style.border = '3px solid #00ffff';
        autoPlayButton.style.color = '#00ffff';
        autoPlayButton.style.fontSize = '28px';
        autoPlayButton.style.cursor = 'pointer';
        autoPlayButton.style.transition = 'all 0.3s';
        autoPlayButton.style.userSelect = 'none';
        
        // Thêm chỉ báo trạng thái
        const statusIndicator = document.createElement('div');
        statusIndicator.id = 'auto-play-status';
        statusIndicator.textContent = 'TẮT';
        statusIndicator.style.color = '#ff4444';
        statusIndicator.style.fontSize = '14px';
        statusIndicator.style.fontWeight = 'bold';
        statusIndicator.style.textAlign = 'center';
        statusIndicator.style.marginTop = '5px';
        statusIndicator.style.textShadow = '0 0 5px rgba(255, 0, 0, 0.7)';
        
        // Thêm nhãn AI Mode
        const aiLabel = document.createElement('div');
        aiLabel.textContent = 'AI MODE';
        aiLabel.style.color = '#00ffff';
        aiLabel.style.fontSize = '16px';
        aiLabel.style.fontWeight = 'bold';
        aiLabel.style.marginBottom = '5px';
        aiLabel.style.textShadow = '0 0 5px rgba(0, 255, 255, 0.7)';
        
        // Thêm thanh điều chỉnh tốc độ
        const speedSlider = document.createElement('input');
        speedSlider.type = 'range';
        speedSlider.id = 'left-auto-play-speed';
        speedSlider.min = '10';  // Siêu nhanh
        speedSlider.max = '200';
        speedSlider.value = '50';
        speedSlider.style.width = '100px';
        speedSlider.style.margin = '10px 0';
        
        // Hiển thị giá trị tốc độ
        const speedValue = document.createElement('div');
        speedValue.id = 'speed-value';
        speedValue.textContent = '50ms';
        speedValue.style.color = 'white';
        speedValue.style.fontSize = '12px';
        
        autoPlayContainer.appendChild(aiLabel);
        autoPlayContainer.appendChild(autoPlayButton);
        autoPlayContainer.appendChild(statusIndicator);
        autoPlayContainer.appendChild(speedSlider);
        autoPlayContainer.appendChild(speedValue);
        document.body.appendChild(autoPlayContainer);
        
        let autoPlayInterval = null;
        
        // Xử lý sự kiện khi kéo thanh trượt
        speedSlider.addEventListener('input', function() {
            const speed = parseInt(speedSlider.value);
            speedValue.textContent = `${speed}ms`;
            
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = setInterval(improvedAutoPlay, speed);
            }
        });
        
        // Xử lý sự kiện khi nhấp vào nút
        autoPlayButton.addEventListener('click', function() {
            if (autoPlayInterval) {
                // Tắt tự động chơi
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
                autoPlayButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                autoPlayButton.style.color = '#00ffff';
                autoPlayButton.style.boxShadow = 'none';
                statusIndicator.textContent = 'TẮT';
                statusIndicator.style.color = '#ff4444';
                statusIndicator.style.textShadow = '0 0 5px rgba(255, 0, 0, 0.7)';
                window.autoPlayState = null;
            } else {
                // Bật tự động chơi
                const speed = parseInt(speedSlider.value);
                autoPlayInterval = setInterval(improvedAutoPlay, speed);
                autoPlayButton.style.backgroundColor = '#00ffff';
                autoPlayButton.style.color = '#000';
                autoPlayButton.style.boxShadow = '0 0 15px #00ffff';
                statusIndicator.textContent = 'BẬT';
                statusIndicator.style.color = '#44ff44';
                statusIndicator.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.7)';
                
                // Khởi động lại game nếu đã kết thúc
                if (gameOver) {
                    init();
                }
            }
        });
        
        console.log("Nút AI đã được thêm vào màn hình");
    }

    // Đảm bảo nút được thêm vào khi trang web đã tải hoàn tất
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM đã tải xong, thêm nút AI");
        setTimeout(addLeftAutoPlayToggle, 1000);
    });

    // Đảm bảo nút được gọi ngay lập tức nếu trang đã tải xong
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log("Trang đã tải xong, thêm nút AI ngay");
        setTimeout(addLeftAutoPlayToggle, 1000);
    }

    /**
     * Vẽ thông tin watermark (Made by chiloc and his AI)
     */
    function drawWatermark() {
        const canvas = document.getElementById('tetris-canvas');
        const ctx = canvas.getContext('2d');
        
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Made by chiloc and his AI', canvas.width - 10, canvas.height - 5);
        ctx.restore();
    }

    // Thêm vẽ watermark vào hàm draw
    const originalDraw = draw;
    draw = function() {
        originalDraw();
        drawWatermark();
    };

    // Thêm một nút riêng biệt nhỏ ở góc màn hình để mở lại panel nếu đã đóng
    function addAIToggleButton() {
        const existingButton = document.getElementById('ai-toggle-button');
        if (existingButton) {
            return; // Nếu đã có nút thì không thêm nữa
        }
        
        const toggleButton = document.createElement('div');
        toggleButton.id = 'ai-toggle-button';
        toggleButton.innerHTML = '🤖';
        toggleButton.title = 'Mở Bot AI';
        toggleButton.style.position = 'fixed';
        toggleButton.style.bottom = '20px';
        toggleButton.style.right = '20px';
        toggleButton.style.width = '40px';
        toggleButton.style.height = '40px';
        toggleButton.style.borderRadius = '50%';
        toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        toggleButton.style.border = '2px solid #00ffff';
        toggleButton.style.color = '#00ffff';
        toggleButton.style.fontSize = '20px';
        toggleButton.style.display = 'flex';
        toggleButton.style.justifyContent = 'center';
        toggleButton.style.alignItems = 'center';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.zIndex = '9998';
        toggleButton.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
        
        toggleButton.addEventListener('click', function() {
            addLeftAutoPlayToggle();
            document.body.removeChild(toggleButton);
        });
        
        document.body.appendChild(toggleButton);
    }

    // Đảm bảo nút được thêm vào khi trang web đã tải hoàn tất
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM đã tải xong, thêm nút AI");
        setTimeout(function() {
            addLeftAutoPlayToggle();
            addAIToggleButton();
        }, 1000);
    });

    // Đảm bảo nút được gọi ngay lập tức nếu trang đã tải xong
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log("Trang đã tải xong, thêm nút AI ngay");
        setTimeout(function() {
            addLeftAutoPlayToggle();
            addAIToggleButton();
        }, 1000);
    }
    
    // Xuất các hàm tự động chơi ra toàn cục để các script khác có thể sử dụng
    window.autoPlay = autoPlay;
