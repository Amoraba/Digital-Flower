import { MUSIC_LIBRARY } from "../types";

export class WebSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentInterval: any = null;
  private nodes: AudioNode[] = [];
  private theme: string = "FurElise";
  private delayNode: DelayNode | null = null;

  constructor() {}

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public play(category: string, track: string) {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.theme = category;

    // Create a beautiful main volume gain node
    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(0.06, this.ctx.currentTime); // low ambient volume

    // Create a global feedback delay for rich retro lushness
    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.setValueAtTime(0.4, this.ctx.currentTime);

    const delayFeedback = this.ctx.createGain();
    delayFeedback.gain.setValueAtTime(0.35, this.ctx.currentTime);

    this.delayNode.connect(delayFeedback);
    delayFeedback.connect(this.delayNode);

    // Dynamic filtering for modern lo-fi touch
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(category === "Celebration" ? 1200 : 800, this.ctx.currentTime);

    // Audio connections
    mainGain.connect(filter);
    filter.connect(this.ctx.destination);
    
    // Wire up delay
    mainGain.connect(this.delayNode);
    this.delayNode.connect(filter);

    this.nodes.push(mainGain, filter, this.delayNode, delayFeedback);

    let step = 0;
    const playStepArr = this.getMelodyPattern(category, track);

    // Scheduling loop (every 220ms to 520ms based on song)
    const stepDuration = category === "EineKleine" ? 220 : category === "ClairDeLune" ? 520 : 340;

    const playNote = (frequency: number, duration: number, type: OscillatorType = "sine", volumeCoeff = 1) => {
      if (!this.ctx || !this.isPlaying) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.12 * volumeCoeff, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(mainGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    };

    this.currentInterval = setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;

      const chord = playStepArr[step % playStepArr.length];
      const timeOffset = stepDuration / 1000;

      // Play bass pedal note every 4 beats
      if (step % 4 === 0 && chord.bass) {
        playNote(chord.bass, timeOffset * 3.8, "triangle", 0.82);
      }

      // Arpeggiate treble notes
      if (chord.treble && chord.treble.length > 0) {
        const trebleNote = chord.treble[step % chord.treble.length];
        
        let oscType: OscillatorType = "sine";
        if (track.endsWith("_retro")) {
          oscType = "triangle";
        } else {
          oscType = "sine";
        }
        
        playNote(trebleNote, timeOffset * 1.8, oscType, 0.45);
      }

      step++;
    }, stepDuration);
  }

  public stop() {
    this.isPlaying = false;
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }
    // Cleanup nodes
    this.nodes.forEach((node) => {
      try {
        node.disconnect();
      } catch (e) {}
    });
    this.nodes = [];
    if (this.ctx && this.ctx.state !== "closed") {
      // Keep context alive but resume later
    }
  }

  // Melodic and Harmonic definitions based on selection
  private getMelodyPattern(category: string, track: string): Array<{ bass?: number; treble: number[] }> {
    // Frequencies (Hz) for beautiful chords and melodies across standard standard octaves
    const notes = {
      // Octave 2
      C2: 65.41, "C#2": 69.30, D2: 73.42, "D#2": 77.78, E2: 82.41, F2: 87.31, "F#2": 92.50, G2: 97.99, "G#2": 103.83, A2: 110.00, "A#2": 116.54, B2: 123.47,
      // Octave 3
      C3: 130.81, "C#3": 138.59, D3: 146.83, "D#3": 155.56, E3: 164.81, F3: 174.61, "F#3": 185.00, G3: 196.00, "G#3": 207.65, A3: 220.00, "A#3": 233.08, B3: 246.94,
      // Octave 4
      C4: 261.63, "C#4": 277.18, D4: 293.66, "D#4": 311.13, E4: 329.63, F4: 349.23, "F#4": 369.99, G4: 392.00, "G#4": 415.30, A4: 440.00, "A#4": 466.16, B4: 493.88,
      // Octave 5
      C5: 523.25, "C#5": 554.37, D5: 587.33, "D#5": 622.25, E5: 659.25, F5: 698.46, "F#5": 739.99, G5: 783.99, "G#5": 830.61, A5: 880.00, "A#5": 932.33, B5: 987.77,
      // Octave 6
      C6: 1046.50
    };

    switch (category) {
      case "FurElise":
        return [
          { bass: notes.A2, treble: [notes.E5] },
          { treble: [notes["D#5"]] },
          { treble: [notes.E5] },
          { treble: [notes["D#5"]] },
          { bass: notes.A2, treble: [notes.E5] },
          { treble: [notes.B4] },
          { treble: [notes.D5] },
          { treble: [notes.C5] },
          { bass: notes.A2, treble: [notes.A4] },
          { treble: [notes.C3] },
          { treble: [notes.E3] },
          { treble: [notes.A3] },
          { bass: notes.E2, treble: [notes.B4] },
          { treble: [notes.E3] },
          { treble: [notes["G#3"]] },
          { treble: [notes.B3] },
        ];

      case "CanonInD":
        return [
          { bass: notes.D2, treble: [notes["F#4"]] },
          { treble: [notes.A4] },
          { treble: [notes.D5] },
          { treble: [notes["F#5"]] },
          { bass: notes.A2, treble: [notes.E4] },
          { treble: [notes.A4] },
          { treble: [notes["C#5"]] },
          { treble: [notes.E5] },
          { bass: notes.B2, treble: [notes.D4] },
          { treble: [notes["F#4"]] },
          { treble: [notes.B4] },
          { treble: [notes.D5] },
          { bass: notes["F#2"], treble: [notes["C#4"]] },
          { treble: [notes["F#4"]] },
          { treble: [notes["A#4"]] },
          { treble: [notes["C#5"]] },
          { bass: notes.G2, treble: [notes.B3] },
          { treble: [notes.D4] },
          { treble: [notes.G4] },
          { treble: [notes.B4] },
          { bass: notes.D2, treble: [notes.A3] },
          { treble: [notes.D4] },
          { treble: [notes["F#4"]] },
          { treble: [notes.A4] },
          { bass: notes.G2, treble: [notes.G3] },
          { treble: [notes.B3] },
          { treble: [notes.D4] },
          { treble: [notes.G4] },
          { bass: notes.A2, treble: [notes.A3] },
          { treble: [notes["C#4"]] },
          { treble: [notes.E4] },
          { treble: [notes.A4] },
        ];

      case "MinuetInG":
        return [
          { bass: notes.G2, treble: [notes.D5] },
          { treble: [notes.G4] },
          { treble: [notes.A4] },
          { treble: [notes.B4] },
          { bass: notes.C3, treble: [notes.C5] },
          { treble: [notes.D5] },
          { treble: [notes.C5] },
          { treble: [notes.B4] },
          { bass: notes.D3, treble: [notes.A4] },
          { treble: [notes.G4] },
          { treble: [notes["F#4"]] },
          { treble: [notes.G4] },
          { bass: notes.G2, treble: [notes.A4] },
          { treble: [notes.D4] },
          { treble: [notes.E4] },
          { treble: [notes["F#4"]] },
        ];

      case "EineKleine":
        return [
          { bass: notes.G2, treble: [notes.G4] },
          { treble: [notes.D4] },
          { treble: [notes.G4] },
          { treble: [notes.D4] },
          { bass: notes.G2, treble: [notes.G4] },
          { treble: [notes.B4] },
          { treble: [notes.D5] },
          { treble: [notes.G4] },
          { bass: notes.C3, treble: [notes.C5] },
          { treble: [notes.G4] },
          { treble: [notes.C5] },
          { treble: [notes.G4] },
          { bass: notes.C3, treble: [notes.C5] },
          { treble: [notes.E5] },
          { treble: [notes.G5] },
          { treble: [notes.C5] },
        ];

      case "ClairDeLune":
      default:
        return [
          { bass: notes["F#2"], treble: [notes["F#5"]] },
          { treble: [notes["F#5"]] },
          { treble: [notes.E5] },
          { treble: [notes.D5] },
          { bass: notes.B2, treble: [notes["C#5"]] },
          { treble: [notes.B4] },
          { treble: [notes["F#4"]] },
          { treble: [notes["G#4"]] },
          { bass: notes.E2, treble: [notes["G#5"]] },
          { treble: [notes["G#5"]] },
          { treble: [notes["F#5"]] },
          { treble: [notes.E5] },
          { bass: notes["C#3"], treble: [notes["D#5"]] },
          { treble: [notes["C#5"]] },
          { treble: [notes["G#4"]] },
          { treble: [notes["A#4"]] },
        ];
    }
  }
}

// Singleton helper to play globally across components
export const globalSynthesizer = new WebSynthesizer();
