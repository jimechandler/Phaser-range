suite('lobby: entering VR puts you in the lobby with an empty body', () => {
  enterVR();
  assert(game.mode === 'vr' && game.phase === 'select', 'select phase on entry');
  assert(stageTable.visible, 'the table is out');
  assert(holoArch.visible, 'the arch stands in the lobby');
  assert(sash.visible, 'the sash is worn in VR');
  assert(!heldBy(0) && !heldBy(1), 'hands start empty');
  assert(HOLSTERS.every((h, k) => !holsterOccupant(k)), 'nothing is dealt to the holsters');
  assert(ARMS.every(w => w.visible), 'everything is visible on the table');
});

suite('grip takes a knife off the table and holds it while squeezed', () => {
  resetAll(); frame();
  const k1 = knife(1);
  handAtWorld(0, tableWorld(k1)); settle();
  grip(0);
  assert(heldBy(0) === k1, 'nearest table weapon comes into the hand');
  assert(k1.userData.holder === 'hand0', 'holder is the hand');
  frame();
  assert(k1.position.distanceTo(worldOf(ctrl(0))) < 1e-6, 'the knife rides the controller');
  grip(0);
  assert(heldBy(0) === k1, 'a second squeeze while full does nothing');
});

suite('let go against the sash: a knife seats in a sheath', () => {
  const k1 = heldBy(0);
  handAtWorld(0, slotWorld(4)); settle();          // sheath 1
  ungrip(0);
  assert(!heldBy(0), 'hand is empty after release');
  assert(k1.userData.holder === 'holster4', 'knife is in sheath 1 (' + k1.userData.holder + ')');
  frame();
  assert(k1.position.distanceTo(slotWorld(4)) < 1e-6, 'the stowed knife sits on the anchor');
});

suite('the sash refuses a phaser', () => {
  handAtWorld(0, tableWorld(arms.fc)); settle(); grip(0);
  assert(heldBy(0) === arms.fc, 'took the First Contact phaser');
  handAtWorld(0, slotWorld(5)); settle();          // sheath 2, empty, well clear of the hips
  ungrip(0);
  assert(arms.fc.userData.holder !== 'holster5', 'not in a sheath');
  assert(arms.fc.userData.holder === 'flight' && arms.fc.userData.dropped, 'it drops instead (' + arms.fc.userData.holder + ')');
  frame(1 / 72, 120);
  assert(arms.fc.userData.holder === 'stuck', 'a dropped phaser comes to rest');
  assert(near(arms.fc.position.y, 0.06, 1e-6), 'on the floor');
  assert(near(arms.fc.rotation.z, Math.PI / 2, 1e-6), 'lying on its side');
});

suite('recover from the floor, stow on a hip', () => {
  handAtWorld(0, arms.fc.position); settle(); grip(0);
  assert(heldBy(0) === arms.fc, 'picked it back up off the floor');
  handAtWorld(0, slotWorld(1)); settle(); ungrip(0);
  assert(arms.fc.userData.holder === 'holster1', 'stowed on the right hip');
  handAtWorld(0, slotWorld(1)); grip(0);
  assert(heldBy(0) === arms.fc, 'and drew it again');
  handAtWorld(0, slotWorld(1)); settle(); ungrip(0);
});

suite('a gentle release over the table lands on the table, not the floor', () => {
  const k2 = knife(2);
  handAtWorld(0, tableWorld(k2)); settle(); grip(0);
  const over = tableWorld(k2).clone(); over.y += 0.30;
  handAtWorld(0, over); settle(); ungrip(0);
  assert(k2.userData.holder === 'flight' && k2.userData.dropped, 'dropped');
  frame(1 / 72, 90);
  assert(k2.userData.holder === 'stuck', 'came to rest');
  assert(near(k2.position.y, TABLE_TOP + 0.03, 1e-6), 'on the table top (' + k2.position.y.toFixed(3) + ')');
  assert(near(k2.rotation.z, 0, 1e-6) && near(k2.rotation.x, 0, 1e-6), 'a knife lies flat');
  // and it can be picked up again from where it lies
  handAtWorld(0, k2.position); settle(); grip(0);
  assert(heldBy(0) === k2, 'recovered off the table');
  ungrip(0); frame(1 / 72, 90);
});

suite('fill the sash: six knives, six sheaths, nowhere else on the chest', () => {
  resetAll(); frame();
  for (let n = 1; n <= 6; n++) {
    const kn = knife(n);
    handAtWorld(0, tableWorld(kn)); settle(); grip(0);
    handAtWorld(0, slotWorld(3 + n)); settle(); ungrip(0);
    assert(kn.userData.holder === 'holster' + (3 + n), 'knife ' + n + ' → sheath ' + n + ' (' + kn.userData.holder + ')');
  }
  assert([4, 5, 6, 7, 8, 9].every(k => holsterOccupant(k)), 'all six sheaths full');
  // a seventh knife has nowhere on the sash to go — use the bat'leth: not a knife, sash refuses it anyway
  const b = arms.batleth;
  handAtWorld(0, tableWorld(b)); settle(); grip(0);
  handAtWorld(0, slotWorld(6)); settle(); ungrip(0);
  assert(b.userData.holder !== 'holster6' && !b.userData.holder.startsWith('holster'), 'bat\'leth does not seat on the sash: ' + b.userData.holder);
  frame(1 / 72, 120);
});

suite('a second hand keeps a rifle when the first lets go', () => {
  resetAll(); frame();
  const r = arms.rifle;
  handAtWorld(0, tableWorld(r)); settle(); grip(0);
  assert(heldBy(0) === r, 'hand 0 has the rifle');
  const fore = worldOf(ctrl(0)); fore.z -= 0.3;
  handAtWorld(1, fore); settle(); grip(1);
  assert(r.userData.support === 1, 'hand 1 steadies it');
  ungrip(0);
  assert(heldBy(1) === r && r.userData.support === null, 'the rifle passes to hand 1');
  assert(!heldBy(0), 'hand 0 is empty');
  ungrip(1); frame(1 / 72, 120);
  assert(r.userData.holder === 'stuck', 'let go with no holster near: it drops');
});

suite('A / X tap no longer stows; the grip is the inventory', () => {
  resetAll(); frame();
  assert(typeof quickStow === 'undefined', 'quickStow is gone');
});
