# Chess Drift

Chess pieces wander around a black and white board.

- The board fills the whole window and follows its size. It is always 10 squares tall, with
  as many square columns as it takes to reach the right edge.
- At the start there are 24 pieces, 12 white and 12 black (a king, a queen, two rooks, two
  bishops, two knights and four pawns each), on random squares.
- Each piece moves by its own chess rule to a random free square, glides there, rests for a
  moment, and moves again. Rooks move straight, bishops diagonally, queens either way, kings
  one square, knights jump in an L, and pawns march forward one or two squares and turn
  around at the edge. Pieces do not capture and do not slide through each other.
- Pieces are simple drawn shapes: white pieces outlined in black, black pieces outlined in
  white, so they show on either colour of square.
- A click on a free square adds a random piece of a random colour there.
- Space pauses and resumes the movement.
