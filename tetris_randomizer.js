/**
 * Hệ thống 7-bag randomizer cho Tetris
 * Mỗi bag chứa 7 khối Tetris (I, O, T, J, L, S, Z) được xáo trộn ngẫu nhiên
 */
class TetrisBagRandomizer {
  constructor() {
    this.tetrominos = ['I', 'O', 'T', 'J', 'L', 'S', 'Z'];
    this.currentBag = [];
    this.generateNewBag();
  }

  /**
   * Tạo một bag mới bằng cách xáo trộn 7 khối tetromino
   * @private
   */
  generateNewBag() {
    // Tạo bản sao của mảng tetrominos
    this.currentBag = [...this.tetrominos];
    
    // Thuật toán Fisher-Yates để xáo trộn mảng
    for (let i = this.currentBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.currentBag[i], this.currentBag[j]] = [this.currentBag[j], this.currentBag[i]];
    }
  }

  /**
   * Lấy khối tetromino tiếp theo từ bag
   * @returns {string} Khối tetromino tiếp theo
   */
  nextPiece() {
    // Nếu bag trống, tạo bag mới
    if (this.currentBag.length === 0) {
      this.generateNewBag();
    }
    
    // Lấy và trả về khối cuối cùng trong bag
    return this.currentBag.pop();
  }

  /**
   * Xem trước các khối tiếp theo mà không lấy ra khỏi bag
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
        // Xáo trộn bag tạm thời
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
}

// Export module nếu đang chạy trong Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TetrisBagRandomizer };
} 