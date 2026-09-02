suite('restart mid-program hands a lost knife back to the sash, not the hidden table', () => {
  enterVR(); resetAll(); frame();
  handAtWorld(0, tableWorld(knife(2))); settle(); grip(0);
  handAtWorld(1, worldOf(lobbyPads[2].mesh)); settle(); handFire(hands[1], true, 'trigger');
  assert(game.running, 'running');
  game.pips = 50;
  placeHand(0, 0.2, 1.4, -0.2); settle();
  for (let k = 0; k < 6; k++) { ctrl(0).position.z -= 3.0 / 72; frame(1 / 72); }
  ungrip(0); frame(1 / 72, 300);
  assert(knife(2).userData.holder === 'stuck', 'knife is planted somewhere out there');
  endProgram(); frame(1 / 72, 72 * 2);
  tryRestart();
  assert(game.running, 'restarted');
  assert(knife(2).userData.holder === 'holster4', 'the knife came back to sheath 1 (' + knife(2).userData.holder + ')');
  quitToMenu(); frame();
  assert(knife(2).userData.holder === 'holster4', 'the lobby leaves what is on your body alone');
});
