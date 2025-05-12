/**
 * Hệ thống 7-bag randomizer thuần túy cho Tetris
 * Mỗi túi chứa 7 khối Tetris khác nhau, được xáo trộn ngẫu nhiên
 * Không có giới hạn khối lặp lại giữa các túi
 */
class TetrisBagRandomizer {
  constructor() {
    this.tetrominos = ['I', 'O', 'T', 'J', 'L', 'S', 'Z'];
    this.currentBag = [];
    this.generateNewBag();
  }

  /**
   * Tạo một túi mới bằng cách xáo trộn 7 khối tetromino
   */
  generateNewBag() {
    // Tạo bản sao của mảng tetrominos
    this.currentBag = [...this.tetrominos];
    
    // Thuật toán Fisher-Yates để xáo trộn mảng
    for (let i = this.currentBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.currentBag[i], this.currentBag[j]] = [this.currentBag[j], this.currentBag[i]];
    }
    
    console.log("Túi mới: " + this.currentBag.join(", "));
  }

  /**
   * Lấy khối tetromino tiếp theo từ túi
   * @returns {string} Khối tetromino tiếp theo
   */
  nextPiece() {
    // Nếu túi trống, tạo túi mới
    if (this.currentBag.length === 0) {
      this.generateNewBag();
    }
    
    // Lấy và trả về khối cuối cùng trong túi
    return this.currentBag.pop();
  }

  /**
   * Xem trước các khối tiếp theo mà không lấy ra khỏi túi
   * @param {number} count - Số lượng khối muốn xem trước
   * @returns {Array} Mảng chứa các khối tiếp theo
   */
  peekNextPieces(count = 1) {
    const pieces = [];
    const tempBag = [...this.currentBag];
    let tempFutureBag = [];
    
    for (let i = 0; i < count; i++) {
      if (tempBag.length === 0) {
        tempFutureBag = [...this.tetrominos];
        // Xáo trộn túi tạm thời
        for (let i = tempFutureBag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [tempFutureBag[i], tempFutureBag[j]] = [tempFutureBag[j], tempFutureBag[i]];
        }
        pieces.push(tempFutureBag.pop());
      } else {
        pieces.push(tempBag.pop());
      }
    }
    
    return pieces;
  }
  
  /**
   * Hiển thị túi hiện tại
   * @returns {Array} Mảng các khối trong túi hiện tại
   */
  getCurrentBag() {
    return [...this.currentBag];
  }
}

// Nếu đang chạy trong Node.js, export module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TetrisBagRandomizer };
} 