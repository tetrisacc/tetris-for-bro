// Script sửa lỗi và khởi tạo lại các hàm tự động chơi
(function() {
    // Đảm bảo cung cấp các hàm tự động chơi toàn cục
    if (!window.autoPlay || !window.improvedAutoPlay) {
        console.log("Đang sửa chữa các hàm tự động chơi...");
        
        // Tạo proxy cho các hàm tự động chơi
        window.autoPlay = function() {
            // Tìm hàm autoPlay trong phạm vi global
            try {
                if (typeof autoPlay === 'function') {
                    return autoPlay();
                } else {
                    return false;
                }
            } catch(e) {
                console.error("Không thể gọi hàm autoPlay:", e);
                return false;
            }
        };
        
        window.improvedAutoPlay = function() {
            // Tìm hàm improvedAutoPlay trong phạm vi global
            try {
                if (typeof improvedAutoPlay === 'function') {
                    return improvedAutoPlay();
                } else {
                    return false;
                }
            } catch(e) {
                console.error("Không thể gọi hàm improvedAutoPlay:", e);
                // Thử sử dụng autoPlay nếu improvedAutoPlay không hoạt động
                try {
                    if (typeof autoPlay === 'function') {
                        return autoPlay();
                    }
                } catch(e2) {
                    console.error("Cả hai hàm đều không hoạt động");
                }
                return false;
            }
        };
    }
    
    // Kiểm tra sự tồn tại của nút AI Mode ở bên trái và thêm nếu không có
    function createAIButton() {
        if (!document.getElementById('left-auto-play-container')) {
            console.log("Đang tạo nút AI Mode...");
            
            // Tạo container cho nút
            const container = document.createElement('div');
            container.id = 'left-auto-play-container';
            container.style.position = 'fixed';
            container.style.left = '20px';
            container.style.top = '50%';
            container.style.transform = 'translateY(-50%)';
            container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            container.style.padding = '15px';
            container.style.borderRadius = '10px';
            container.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
            container.style.zIndex = '10000';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.style.gap = '10px';
            
            // Tạo tiêu đề
            const title = document.createElement('div');
            title.textContent = 'AI MODE';
            title.style.color = '#00ffff';
            title.style.fontSize = '16px';
            title.style.fontWeight = 'bold';
            title.style.textShadow = '0 0 5px rgba(0, 255, 255, 0.7)';
            
            // Tạo nút tự động chơi
            const button = document.createElement('div');
            button.id = 'ai-mode-button';
            button.innerHTML = '🤖';
            button.title = 'Bot tự động chơi';
            button.style.width = '60px';
            button.style.height = '60px';
            button.style.borderRadius = '50%';
            button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            button.style.border = '3px solid #00ffff';
            button.style.color = '#00ffff';
            button.style.fontSize = '28px';
            button.style.display = 'flex';
            button.style.justifyContent = 'center';
            button.style.alignItems = 'center';
            button.style.cursor = 'pointer';
            button.style.transition = 'all 0.3s';
            
            // Tạo trạng thái
            const status = document.createElement('div');
            status.id = 'ai-mode-status';
            status.textContent = 'TẮT';
            status.style.color = '#ff4444';
            status.style.fontSize = '14px';
            status.style.fontWeight = 'bold';
            status.style.textShadow = '0 0 5px rgba(255, 0, 0, 0.7)';
            
            // Tạo thanh trượt tốc độ
            const speedSlider = document.createElement('input');
            speedSlider.type = 'range';
            speedSlider.id = 'ai-mode-speed';
            speedSlider.min = '50';
            speedSlider.max = '500';
            speedSlider.value = '100';
            speedSlider.style.width = '100px';
            
            // Tạo hiển thị tốc độ
            const speedDisplay = document.createElement('div');
            speedDisplay.id = 'ai-mode-speed-display';
            speedDisplay.textContent = '100ms';
            speedDisplay.style.color = 'white';
            speedDisplay.style.fontSize = '12px';
            
            // Thêm các phần tử vào container
            container.appendChild(title);
            container.appendChild(button);
            container.appendChild(status);
            container.appendChild(speedSlider);
            container.appendChild(speedDisplay);
            
            // Thêm container vào body
            document.body.appendChild(container);
            
            // Biến lưu trữ interval
            let aiModeInterval = null;
            
            // Xử lý sự kiện khi kéo thanh trượt tốc độ
            speedSlider.addEventListener('input', function() {
                const speed = speedSlider.value;
                speedDisplay.textContent = speed + 'ms';
                
                // Cập nhật tốc độ nếu đang chạy
                if (aiModeInterval) {
                    clearInterval(aiModeInterval);
                    startAIMode(parseInt(speed));
                }
            });
            
            // Hàm bắt đầu AI Mode
            function startAIMode(speed) {
                aiModeInterval = setInterval(function() {
                    try {
                        if (typeof window.improvedAutoPlay === 'function') {
                            window.improvedAutoPlay();
                        } else if (typeof window.autoPlay === 'function') {
                            window.autoPlay();
                        }
                    } catch (e) {
                        console.error("Lỗi AI Mode:", e);
                    }
                }, speed);
            }
            
            // Xử lý sự kiện khi nhấp vào nút
            button.addEventListener('click', function() {
                if (aiModeInterval) {
                    // Tắt AI Mode
                    clearInterval(aiModeInterval);
                    aiModeInterval = null;
                    button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                    button.style.color = '#00ffff';
                    button.style.boxShadow = 'none';
                    status.textContent = 'TẮT';
                    status.style.color = '#ff4444';
                    status.style.textShadow = '0 0 5px rgba(255, 0, 0, 0.7)';
                } else {
                    // Bật AI Mode
                    const speed = parseInt(speedSlider.value);
                    startAIMode(speed);
                    
                    // Thay đổi giao diện nút
                    button.style.backgroundColor = '#00ffff';
                    button.style.color = '#000';
                    button.style.boxShadow = '0 0 15px #00ffff';
                    status.textContent = 'BẬT';
                    status.style.color = '#44ff44';
                    status.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.7)';
                }
            });
            
            console.log("Đã tạo nút AI Mode");
        }
    }
    
    // Đợi DOM tải xong và tạo nút
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(createAIButton, 1000);
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(createAIButton, 1000);
        });
    }
})(); 