import { useEffect, useRef, useState } from 'react';
import { Sparkles, Play, Pause } from 'lucide-react';
import {
  createExerciseVisualizer,
  EXERCISE_LIST,
  type CameraPreset,
  type VisualizerHandle,
  type VisualizerState,
} from '@/lib/exerciseVisualizer';
import '@/styles/visualizer.css';

const CAMERAS: { id: CameraPreset; label: string }[] = [
  { id: 'angle', label: '3/4' },
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side' },
];

export function ExerciseDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<VisualizerHandle | null>(null);

  const [state, setState] = useState<VisualizerState>({ exerciseId: 'push-ups', reps: 0, isHold: false });
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [camera, setCamera] = useState<CameraPreset>('angle');

  // Mount the three.js scene once. A fresh <canvas> per mount (React key
  // never changes here) plus full disposal in the cleanup keeps this safe
  // under StrictMode's dev-only double-invoke.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const { clientWidth, clientHeight } = container;
    const handle = createExerciseVisualizer(canvas, clientWidth || 800, clientHeight || 520);
    handleRef.current = handle;

    const unsubscribe = handle.subscribe(setState);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      handle.resize(width, height);
    });
    resizeObserver.observe(container);

    return () => {
      unsubscribe();
      resizeObserver.disconnect();
      handle.dispose();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    handleRef.current?.setPlaying(playing);
  }, [playing]);

  useEffect(() => {
    handleRef.current?.setSpeed(speed);
  }, [speed]);

  useEffect(() => {
    handleRef.current?.setCamera(camera);
  }, [camera]);

  const activeExercise = EXERCISE_LIST.find((e) => e.id === state.exerciseId) ?? EXERCISE_LIST[0];

  return (
    <div className="card overflow-hidden">
      <div
        ref={containerRef}
        className="viz-root h-[480px] sm:h-[560px] lg:h-[640px]"
      >
        <canvas ref={canvasRef} className="viz-canvas" />

        <div className="viz-topbar">
          <div className="viz-brand">
            <span className="viz-dot" />
            <Sparkles className="h-3.5 w-3.5" /> Interactive 3D demo
          </div>
          <div className="viz-pills">
            {EXERCISE_LIST.map((ex) => (
              <button
                key={ex.id}
                className={`viz-pill ${ex.id === state.exerciseId ? 'viz-active' : ''}`}
                onClick={() => handleRef.current?.selectExercise(ex.id)}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="viz-cam-presets">
          {CAMERAS.map((c) => (
            <button
              key={c.id}
              className={`viz-cam-btn ${camera === c.id ? 'viz-active' : ''}`}
              onClick={() => setCamera(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="viz-info-card">
          <h3>{activeExercise.label}</h3>
          <p>{activeExercise.description}</p>
          <div className="viz-muscle-tags">
            {activeExercise.muscles.map((m) => (
              <span key={m} className="viz-muscle-tag">
                {m}
              </span>
            ))}
          </div>
          <div className="viz-controls-row">
            <button
              className="viz-btn-icon"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <div className="viz-speed-wrap">
              <span>SPEED</span>
              <input
                type="range"
                min={0.3}
                max={2}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
              />
              <span>{speed.toFixed(1)}&times;</span>
            </div>
          </div>
        </div>

        <div className="viz-stat-card">
          <div className="viz-num">{state.reps}</div>
          <div className="viz-lbl">{state.isHold ? 'Seconds Held' : 'Reps'}</div>
        </div>
      </div>
    </div>
  );
}
