# Corner Bounce

A logo bounces around a black screen like an old screensaver, changing color at every
bounce. Every so often it lands exactly in a corner.

- The logo moves diagonally and bounces off all four edges. Each bounce gives it a new color.
- After 6 to 13 bounces the logo's speed along one axis is adjusted slightly, by at most 30%,
  so that it reaches a side edge and a top or bottom edge at the same moment and lands
  exactly in a corner.
- A corner hit flashes the screen, shows "CORNER!" in the middle, sprays confetti out of
  that corner, and starts a new heading at a slightly different angle.
- The top-left line shows the number of corner hits, the bounces since the last corner, and
  the speed.
- A click moves the logo to the pointer and sends it off in a random diagonal direction.
- Up and Down make the logo faster or slower (0.4x to 3x).
- C aims for a corner at the next bounce.
- Space resets the counters and starts the logo from a random position.
- The screen fills the whole window and follows its size.
