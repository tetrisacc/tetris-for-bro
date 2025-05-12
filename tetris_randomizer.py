import random

class TetrisBagRandomizer:
    def __init__(self):
        self.tetrominos = ['I', 'O', 'T', 'J', 'L', 'S', 'Z']
        self.current_bag = []
        self._generate_new_bag()
    
    def _generate_new_bag(self):
        """Tạo một bag mới bằng cách xáo trộn ngẫu nhiên 7 khối tetromino."""
        self.current_bag = self.tetrominos.copy()
        random.shuffle(self.current_bag)
    
    def next_piece(self):
        """Lấy ra khối tetromino tiếp theo từ bag hiện tại."""
        if not self.current_bag:
            self._generate_new_bag()
        return self.current_bag.pop()
    
    def peek_next_pieces(self, count=1):
        """Xem trước các khối tiếp theo mà không lấy ra khỏi bag."""
        pieces = []
        temp_bag = self.current_bag.copy()
        
        for _ in range(count):
            if not temp_bag:
                # Tạo bag mới tạm thời để xem trước
                temp_bag = self.tetrominos.copy()
                random.shuffle(temp_bag)
            pieces.append(temp_bag.pop())
            
        return pieces

    def get_next_bag(self):
        """Trả về một bag mới gồm 7 khối xáo trộn."""
        bag = self.tetrominos.copy()
        random.shuffle(bag)
        return bag


# Ví dụ sử dụng
if __name__ == "__main__":
    randomizer = TetrisBagRandomizer()
    
    print("Lấy từng mảnh:")
    for _ in range(10):
        print(randomizer.next_piece(), end=" ")
    
    print("\n\nXem trước 3 mảnh tiếp theo:")
    print(randomizer.peek_next_pieces(3))
    
    print("\nLấy một bag mới hoàn chỉnh:")
    print(randomizer.get_next_bag()) 