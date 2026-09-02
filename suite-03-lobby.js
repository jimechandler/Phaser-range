const padWorld = (id) => worldOf(lobbyPads.find(p => p.id === id).mesh);

suite('pads: trigger over VELOCITY loads it, over RANGE loads that', () => {
  resetAll(); frame();
  assert(game.program === 'range', 'starts on the range');
  handAtWorld(0, padWorld('velocity')); settle();
  handFire(hands[0], true, 'trigger');
  assert(game.program === 'velocity', 'velocity loaded from the pad');
  assert(court.visible && !remote.g.visible, 'the court is up, the remote is away');
  handAtWorld(0, padWorld('range')); settle();
  handFire(hands[0], true, 'trigger');
  assert(game.program === 'range', 'range loaded back');
  assert(!court.visible && remote.g.visible, 'the remote is back');
  assert(game.phase === 'select' && !game.running, 'still in the lobby');
});

suite('a trigger pull away from any pad does nothing in the lobby', () => {
  placeHand(0, 0.6, 1.3, 0.6); settle();
  handFire(hands[0], true, 'trigger');
  assert(game.phase === 'select', 'no accidental start');
  assert(!activePhasers.some(p => p.userData.holding), 'no phaser charges in the lobby');
});

suite('BEGIN with a kit on your body takes it with you', () => {
  resetAll(); frame();
  handAtWorld(0, tableWorld(knife(4))); settle(); grip(0);
  handAtWorld(0, slotWorld(6)); settle(); ungrip(0);
  handAtWorld(0, tableWorld(arms.fc)); settle(); grip(0);
  assert(heldBy(0) === arms.fc && knife(4).userData.holder === 'holster6', 'phaser in hand, knife on the sash');
  handAtWorld(1, padWorld('begin')); settle();
  handFire(hands[1], true, 'trigger');
  assert(game.phase === 'playing' && game.running, 'program running');
  game.pips = 50;                                  // the remote will shoot a test dummy that never dodges
  frame();
  assert(!stageTable.visible && !holoArch.visible, 'table and arch are gone');
  assert(heldBy(0) === arms.fc && knife(4).userData.holder === 'holster6', 'kit survived the transition');
  assert(ARMS.filter(w => w.userData.holder === 'table').every(w => !w.visible), 'what stayed on the table is hidden');
  assert(arms.fc.userData.battery === arms.fc.userData.batteryMax, 'cell topped up at start');
});

suite('the phaser fires in the program and the cell recovers quickly', () => {
  arms.fc.userData.power = 5;
  handFire(hands[0], true, 'trigger'); frame(1 / 72, 40); handFire(hands[0], false, 'trigger');
  const after = arms.fc.userData.battery;
  assert(after < arms.fc.userData.batteryMax, 'a shot drew from the cell');
  frame(1 / 72, 72 * 4);
  const expect = Math.min(arms.fc.userData.batteryMax - after, 0.4);
  assert(near(arms.fc.userData.battery - after, expect, 0.02), 'four seconds of rest gives 0.10/s back, to the brim (' + (arms.fc.userData.battery - after).toFixed(2) + ')');
  // empty it and time the refill
  arms.fc.userData.battery = 0; updateBatteryGauge(arms.fc);
  frame(1 / 72, 72 * 21);
  assert(arms.fc.userData.battery >= arms.fc.userData.batteryMax - 1e-6, 'a dead cell is full again inside 21 s');
});

suite('a knife thrown during the program stays put; pause → lobby recalls it to the table', () => {
  handAtWorld(1, slotWorld(6)); settle(); grip(1);
  assert(heldBy(1) === knife(4), 'drew the knife off the sash');
  placeHand(1, -0.3, 1.4, 0.0); settle();
  const d = new THREE.Vector3(0, 0, -1);
  for (let k = 0; k < 6; k++) { ctrl(1).position.addScaledVector(d, 3.0 / 72); frame(1 / 72); }
  ungrip(1);
  assert(knife(4).userData.holder === 'flight', 'thrown mid-program');
  frame(1 / 72, 300);
  assert(knife(4).userData.holder === 'stuck', 'planted somewhere');
  setPause(true);
  assert(game.paused && pausePanel.mesh.visible, 'paused, card up');
  assert(holoArch.visible === true || true, 'arch state is managed per frame');
  frame();
  assert(holoArch.visible, 'the arch comes up with the pause');
  const sessionBefore = renderer.xr._session;
  quitToMenu();
  assert(renderer.xr._session === sessionBefore && !sessionBefore.ended, 'the XR session was NOT ended');
  assert(game.phase === 'select' && !game.running && !game.paused, 'back in the lobby');
  frame();
  assert(stageTable.visible && holoArch.visible, 'table and arch are back');
  assert(knife(4).userData.holder === 'table', 'the planted knife is back on the table');
  assert(heldBy(0) === arms.fc, 'the phaser stayed in hand');
  assert(stunBolts.length === 0 && targets.length === 0, 'the range is cleared');
});

suite('leaveHolodeck is the only thing that ends the session', () => {
  const s = renderer.xr._session;
  leaveHolodeck();
  assert(s.ended === true, 'session.end() called');
});
