// Куски движка, одинаковые во всех играх.

/** Готовая функция движка: картинка из набора HitBox по имени. picture(name) даёт обвязка игры. */
export const DRAW_PIC = `// ===== КАРТИНКИ =====
// drawPic("кот", x, y) рисует картинку 34 × 34 из набора HitBox.
// Низ картинки — на высоте y, как у текста в fillText.
function drawPic(name, x, y) {
  ctx.drawImage(picture(name), x, y - 30, 34, 34);
}`
