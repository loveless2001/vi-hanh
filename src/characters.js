// Thứ tự các khung 32 × 32 trên bảng hình nhân vật, mỗi hàng sáu ô.
export const CAST = {
  c_player: 0, c_back: 1, c_profile: 2, c_man: 3, c_ti: 4, c_sau: 5,
  c_lanh: 6, c_goat: 7, c_man2: 8, c_ti2: 9, c_sau2: 10, c_lanh2: 11,
  c_tho: 12, c_may: 13, c_ti3: 14, c_sau3: 15, c_lanh3: 16, c_goat_tag: 17,
};

export function facePlayer(sprite, [dx, dy]) {
  sprite.setFrame(dx ? CAST.c_profile : dy < 0 ? CAST.c_back : CAST.c_player);
  sprite.setFlipX(dx < 0);
}
