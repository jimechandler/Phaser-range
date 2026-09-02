/* shared helpers: a fake headset session and a way to step frames */
let _t = 0;
this.frame = (dt = 1 / 72, n = 1) => { for (let k = 0; k < n; k++) { _t += dt; renderer._loop(_t * 1000); } };
this.enterVR = () => {
  renderer.xr.isPresenting = true; renderer.xr._session = { end() { this.ended = true; }, ended: false, addEventListener() {} };
  camera.position.set(0, 1.6, 0); camera.rotation.set(0, 0, 0);
  startProgram('vr');
  frame(1 / 72, 3);
};
this.ctrl = (i) => vrControllers[i];
/* put a controller somewhere in world space (the rig is at the origin in these tests) */
this.placeHand = (i, x, y, z) => { ctrl(i).position.set(x, y, z); };
this.handAtWorld = (i, v) => { ctrl(i).position.copy(v); };
this.worldOf = (o) => o.getWorldPosition(new THREE.Vector3());
/* settle the hand for a few frames so its velocity window reads zero */
this.settle = (n = 8) => frame(1 / 72, n);
this.grip = (i) => handGrip(i);
this.ungrip = (i) => handGripEnd(i);
this.slotWorld = (k) => worldOf(HOLSTERS[k].anchor);
this.tableWorld = (w) => worldOf(w.userData.tableAnchor);
this.knife = (n) => arms['dktahg' + n];
this.resetAll = () => { ARMS.forEach(w => returnToTable(w)); thrown.length = 0; hands.forEach(h => { if (h.velHist) h.velHist.forEach(v => v.set(0,0,0)); }); };

suite('boot: armory, sash, table, cell', () => {
  assert(ARMS.length === 11, 'eleven weapons: 4 guns, bat\'leth, six d\'k tahgs');
  assert(instancesOf('dktahg').length === 6, 'six d\'k tahg instances');
  assert(arms.dktahg1 && arms.dktahg6 && arms.dktahg1 !== arms.dktahg6, 'knives are distinct objects');
  assert(arms.dktahg3.userData.label === "D'K TAHG 3", 'knives are numbered');
  assert(ARMS.every(w => w.userData.holder === 'table'), 'everything starts on the table');
  assert(ARMS.every(w => w.userData.tableAnchor), 'every instance has its own table slot');
  const xs = instancesOf('dktahg').map(w => w.userData.tableAnchor.position.x);
  assert(new Set(xs).size === 6, 'six knives get six different slots');
  assert(HOLSTERS.length === 10, 'four holsters plus six sash sheaths');
  assert(HOLSTERS.slice(4).every(h => h.accepts === 'dktahg'), 'sheaths take knives only');
  assert(sash.name === 'KlingonSash' && sash.parent === bodyFrame, 'the sash rides the body frame');
  assert(sash.children.filter(c => /^SashSheath\d$/.test(c.name)).length === 6, 'six sheath meshes');
  assert(sash.children.every(c => c.name), 'every sash part is named');
  assert(lobbyPads.length === 3 && lobbyPads.map(p => p.id).join() === 'range,velocity,begin', 'three lobby pads');
  assert(arms.fc.userData.batteryMax === 2.0 && arms.rifle.userData.batteryMax === 3.8, 'cells hold twice v0.17 capacity');
  assert(near(TUNE.batteryRegen, 0.10), 'regen is 0.10 units/s');
  // the sash runs right shoulder → left hip, on the front of the body
  const s1 = HOLSTERS[4].anchor.position, s6 = HOLSTERS[9].anchor.position;
  assert(s1.x > s6.x && s1.y > s6.y, 'sheath 1 is up by the right shoulder, sheath 6 down by the left hip');
  assert(s1.z < 0.05 && s6.z < 0.08, 'the sash sits on the chest, not the back');
  // table slots keep everything on the table top
  ARMS.forEach(w => { const p = w.userData.tableAnchor.position;
    assert(Math.abs(p.x) < TABLE_W / 2 && Math.abs(p.z) < TABLE_D / 2 && p.y > TABLE_TOP, 'slot on the table: ' + w.userData.id); });
  assert(!HOLSTERS.some(h => h.ring === undefined), 'every holster has a ring field (null for sheaths)');
});
