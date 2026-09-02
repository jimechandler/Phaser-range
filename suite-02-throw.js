/* move a hand along a direction at a speed for n frames, then hold still for `pause` frames */
const swing = (i, dir, speed, n, pause) => {
  const d = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize(), dt = 1 / 72;
  for (let k = 0; k < n; k++) { ctrl(i).position.addScaledVector(d, speed * dt); frame(dt); }
  for (let k = 0; k < pause; k++) frame(dt);
};

suite('release mid-swing throws the knife', () => {
  resetAll(); frame();
  const k1 = knife(1);
  handAtWorld(0, tableWorld(k1)); settle(); grip(0);
  placeHand(0, 0.2, 1.4, -0.2); settle();
  swing(0, [0, 0.2, -1], 3.0, 6, 0);
  ungrip(0);
  assert(k1.userData.holder === 'flight' && !k1.userData.dropped, 'thrown, not dropped (' + k1.userData.holder + ')');
  const v = k1.userData.vel.length();
  assert(v > 3.0 * TUNE.throwBoost * 0.9, 'flight speed carries the swing (' + v.toFixed(2) + ' m/s)');
  assert(k1.userData.vel.z < 0, 'flies the way the hand went');
  frame(1 / 72, 300);
  assert(k1.userData.holder === 'stuck', 'plants where it lands');
});

suite('fingers open after the apex: two slow frames before release still throw', () => {
  resetAll(); frame();
  const k1 = knife(1);
  handAtWorld(0, tableWorld(k1)); settle(); grip(0);
  placeHand(0, 0.2, 1.4, -0.2); settle();
  swing(0, [0, 0, -1], 2.6, 6, 0);
  swing(0, [0, 0, -1], 0.4, 2, 0);         // decelerating — the frame the button opens on is slow
  ungrip(0);
  assert(k1.userData.holder === 'flight' && !k1.userData.dropped, 'peak-of-window velocity decides the throw');
  frame(1 / 72, 300);
});

suite('a throw past the shoulder holster still throws (v0.17 stowed it)', () => {
  resetAll(); frame();
  const k1 = knife(1);
  handAtWorld(0, tableWorld(k1)); settle(); grip(0);
  const sh = slotWorld(3); sh.z += 0.10;         // right shoulder, hand passing just behind it on the wind-up
  handAtWorld(0, sh); settle();
  swing(0, [0, 0.3, -1], 3.2, 3, 0);            // overhand snap, hand still within holster reach
  const d = worldOf(ctrl(0)).distanceTo(slotWorld(3));
  assert(d < TUNE.holsterReach, 'hand is within holster reach at release (' + d.toFixed(2) + ' m)');
  ungrip(0);
  assert(k1.userData.holder === 'flight', 'thrown, not stowed');
  frame(1 / 72, 300);
});

suite('a gentle release near the shoulder stows, a gentle one elsewhere drops', () => {
  resetAll(); frame();
  const k1 = knife(1);
  handAtWorld(0, tableWorld(k1)); settle(); grip(0);
  handAtWorld(0, slotWorld(3)); settle(); ungrip(0);
  assert(k1.userData.holder === 'holster3', 'knife on the right shoulder');
  handAtWorld(0, slotWorld(3)); grip(0);
  placeHand(0, 0.6, 1.2, 0.6); settle(); ungrip(0);
  assert(k1.userData.holder === 'flight' && k1.userData.dropped, 'dropped in open air');
  assert(k1.userData.vel.length() < 1.3, 'a drop is not a fling (' + k1.userData.vel.length().toFixed(2) + ')');
  frame(1 / 72, 120);
  assert(k1.userData.holder === 'stuck' && near(k1.position.y, 0.06, 1e-6), 'on the floor');
});

suite('a phaser never flies, whatever the swing', () => {
  resetAll(); frame();
  handAtWorld(0, tableWorld(arms.tng)); settle(); grip(0);
  placeHand(0, 0.2, 1.4, -0.2); settle();
  swing(0, [0, 0, -1], 4.0, 6, 0);
  ungrip(0);
  assert(arms.tng.userData.holder === 'flight' && arms.tng.userData.dropped, 'a gun let go at speed is a drop');
  frame(1 / 72, 120);
  assert(arms.tng.userData.holder === 'stuck', 'it lands');
  assert(near(arms.tng.rotation.z, 0, 1e-6), 'the TNG wedge lies flat');
});

suite('desktop: G throws with a synthetic velocity, X drops', () => {
  resetAll(); frame();
  game.mode = 'desk'; setupDesk(); refreshHeld();
  deskTake(ARMORY[5]);
  const cur = heldBy(2);
  assert(cur && cur.userData.def.id === 'dktahg', 'desk took a knife');
  const v = new THREE.Vector3(0, 1.2, -9);
  assert(throwWeapon(cur, 2, v), 'throwWeapon with an explicit velocity');
  assert(cur.userData.holder === 'flight', 'flying');
  deskTake(ARMORY[0]);
  const fc = heldBy(2); assert(fc === arms.fc, 'desk took the FC phaser');
  dropWeapon(fc, 2);
  assert(fc.userData.holder === 'flight' && fc.userData.dropped, 'X-style drop from the desk hand');
  frame(1 / 72, 200);
  game.mode = 'vr';
});
