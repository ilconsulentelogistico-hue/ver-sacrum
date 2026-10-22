const test=require("node:test"),assert=require("node:assert/strict"),make=require("./harness.cjs");
test("sound falls back silently, respects saved mute and plays only requested cues",()=>{
  const {g,sandbox,byId}=make([["ver-sacrum-sound-muted-v1","1"]],{neutrals:true});
  assert.equal(g.audioMuted,true);assert.equal(byId.soundToggle.disabled,true);assert.equal(g.playCue("win"),false);
  let oscillators=0;
  sandbox.AudioContext=class {state="running";currentTime=0;destination={};createOscillator(){oscillators++;return{frequency:{value:0},connect(){},start(){},stop(){}}}createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}}};
  g.audioMuted=false;assert.equal(g.playCue("win"),true);assert.equal(oscillators,3);
  assert.equal(g.playCue("unknown"),false);
});
