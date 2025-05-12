import random

class TetrisBagRandomizer:
    def __init__(self):
        self.tetrominos = ['I', 'O', 'T', 'J', 'L', 'S', 'Z']
        self.current_bag = []
        self.bag_count = 0
        self._generate_new_bag()
    
    def _generate_new_bag(self):
        """Tạo một bag mới bằng cách xáo trộn ngẫu nhiên 7 khối tetromino."""
        self.current_bag = self.tetrominos.copy()
        random.shuffle(self.current_bag)
        self.bag_count += 1
        print(f"\nBag #{self.bag_count} được tạo: {self.current_bag}")
    
    def next_piece(self):
        """Lấy ra khối tetromino tiếp theo từ bag hiện tại."""
        if not self.current_bag:
            self._generate_new_bag()
        return self.current_bag.pop()

# Demo rõ ràng về hệ thống 7-bag
if __name__ == "__main__":
    # Đặt seed để kết quả dễ theo dõi
    random.seed(42)
    
    randomizer = TetrisBagRandomizer()
    
    print("Demo hệ thống 7-bag Randomizer:")
    print("-" * 40)
    
    # Lấy các khối từ túi thứ nhất
    print("Lấy lần lượt các khối từ bag #1:")
    for i in range(7):
        piece = randomizer.next_piece()
        print(f"  Khối #{i+1}: {piece} (Còn lại trong bag: {randomizer.current_bag})")
    
    # Bag đầu tiên đã hết, tự động tạo bag thứ hai
    print("\nLấy lần lượt các khối từ bag #2:")
    for i in range(7):
        piece = randomizer.next_piece()
        print(f"  Khối #{i+1}: {piece} (Còn lại trong bag: {randomizer.current_bag})")
    
    # Bag thứ hai đã hết, tự động tạo bag thứ ba
    print("\nLấy lần lượt các khối từ bag #3:")
    for i in range(7):
        piece = randomizer.next_piece()
        print(f"  Khối #{i+1}: {piece} (Còn lại trong bag: {randomizer.current_bag})")
    
    print("\nNhận xét: Mỗi bag chứa đúng 7 khối Tetris được xáo trộn")
    print("Khi bag hiện tại hết, một bag mới sẽ được tạo tự động")
    print("Mỗi bag đảm bảo đủ tất cả các loại khối (I, O, T, J, L, S, Z)") 