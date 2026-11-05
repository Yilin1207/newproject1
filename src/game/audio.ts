/** Locally synthesized ambience. No network, recording, or external audio assets. */
export class Soundscape {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private volume = 0.25;
  start() {
    if (this.context) { void this.context.resume(); return; }
    try {
      const context = new AudioContext();
      const buffer = context.createBuffer(1,context.sampleRate*4,context.sampleRate);
      const samples = buffer.getChannelData(0);
      let brown = 0;
      for(let i=0;i<samples.length;i++) { brown=(brown+(Math.random()*2-1)*.02)/1.02; samples[i]=brown*3.5; }
      const source=context.createBufferSource(); source.buffer=buffer; source.loop=true;
      const filter=context.createBiquadFilter(); filter.type="lowpass"; filter.frequency.value=650;
      const gain=context.createGain(); gain.gain.value=this.volume*.22;
      source.connect(filter); filter.connect(gain); gain.connect(context.destination); source.start();
      this.context=context; this.source=source; this.gain=gain; this.filter=filter;
    } catch { /* A blocked audio device must never prevent playing. */ }
  }
  set(volume:number,storm:boolean,paused:boolean) {
    this.volume=volume;
    if(this.context&&this.gain&&this.filter) {
      this.gain.gain.setTargetAtTime(paused ? 0 : volume * (storm ? .6 : .22),this.context.currentTime,.4);
      this.filter.frequency.setTargetAtTime(storm?2200:650,this.context.currentTime,1);
    }
  }
  chime() {
    if(!this.context||!this.gain||this.volume===0)return;
    const t=this.context.currentTime;
    for(const [i,f] of [523.25,659.25,783.99].entries()) {
      const oscillator=this.context.createOscillator(), envelope=this.context.createGain();
      oscillator.type="sine"; oscillator.frequency.value=f;
      envelope.gain.setValueAtTime(0,t+i*.09); envelope.gain.linearRampToValueAtTime(this.volume*.12,t+i*.09+.02); envelope.gain.exponentialRampToValueAtTime(.001,t+i*.09+.7);
      oscillator.connect(envelope); envelope.connect(this.context.destination); oscillator.start(t+i*.09); oscillator.stop(t+i*.09+.75);
    }
  }
  dispose() { this.source?.stop(); if(this.context)void this.context.close(); this.context=null; this.source=null; }
}
