// Script để thêm nút tự động chơi vào trò chơi Tetris
document.addEventListener('DOMContentLoaded', function() {
    // Đảm bảo trang đã tải xong
    setTimeout(function() {
        // Tạo container cho nút
        const container = document.createElement('div');
        container.id = 'autoplay-button-container';
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
        button.id = 'autoplay-button';
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
        status.id = 'autoplay-status';
        status.textContent = 'TẮT';
        status.style.color = '#ff4444';
        status.style.fontSize = '14px';
        status.style.fontWeight = 'bold';
        status.style.textShadow = '0 0 5px rgba(255, 0, 0, 0.7)';
        
        // Tạo thanh trượt tốc độ
        const speedSlider = document.createElement('input');
        speedSlider.type = 'range';
        speedSlider.id = 'autoplay-speed';
        speedSlider.min = '50';
        speedSlider.max = '500';
        speedSlider.value = '150';
        speedSlider.style.width = '100px';
        
        // Tạo hiển thị tốc độ
        const speedDisplay = document.createElement('div');
        speedDisplay.id = 'autoplay-speed-display';
        speedDisplay.textContent = '150ms';
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
        let autoPlayInterval = null;
        
        // Xử lý sự kiện khi kéo thanh trượt tốc độ
        speedSlider.addEventListener('input', function() {
            const speed = speedSlider.value;
            speedDisplay.textContent = speed + 'ms';
            
            // Cập nhật tốc độ nếu đang chạy
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = setInterval(function() {
                    // Gọi hàm tự động chơi nếu có
                    if (window.improvedAutoPlay) {
                        window.improvedAutoPlay();
                    } else if (window.autoPlay) {
                        window.autoPlay();
                    }
                }, parseInt(speed));
            }
        });
        
        // Xử lý sự kiện khi nhấp vào nút
        button.addEventListener('click', function() {
            if (autoPlayInterval) {
                // Tắt tự động chơi
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
                button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                button.style.color = '#00ffff';
                button.style.boxShadow = 'none';
                status.textContent = 'TẮT';
                status.style.color = '#ff4444';
                status.style.textShadow = '0 0 5px rgba(255, 0, 0, 0.7)';
            } else {
                // Bật tự động chơi
                const speed = parseInt(speedSlider.value);
                autoPlayInterval = setInterval(function() {
                    // Gọi hàm tự động chơi nếu có
                    if (window.improvedAutoPlay) {
                        window.improvedAutoPlay();
                    } else if (window.autoPlay) {
                        window.autoPlay();
                    }
                }, speed);
                
                // Thay đổi giao diện nút
                button.style.backgroundColor = '#00ffff';
                button.style.color = '#000';
                button.style.boxShadow = '0 0 15px #00ffff';
                status.textContent = 'BẬT';
                status.style.color = '#44ff44';
                status.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.7)';
            }
        });
        
        console.log("Đã thêm nút tự động chơi cơ bản vào trang.");
    }, 1000); // Chờ 1 giây sau khi trang đã tải xong
}); 