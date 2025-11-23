import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SimulationEngine } from '../../server/simulation/engine.js';

describe('SimulationEngine', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = new SimulationEngine(5000);
  });

  afterEach(() => {
    engine.stop();
    vi.useRealTimers();
  });

  it('should not be running initially', () => {
    expect(engine.getIsRunning()).toBe(false);
  });

  it('should start and set isRunning to true', () => {
    engine.start();
    expect(engine.getIsRunning()).toBe(true);
  });

  it('should stop and set isRunning to false', () => {
    engine.start();
    engine.stop();
    expect(engine.getIsRunning()).toBe(false);
  });

  it('should not start twice if already running', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    engine.start();
    engine.start();
    // Only one "started" log
    const startLogs = consoleSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('started')
    );
    expect(startLogs).toHaveLength(1);
    consoleSpy.mockRestore();
  });

  it('should use configurable tick interval', () => {
    const customEngine = new SimulationEngine(1000);
    customEngine.start();
    expect(customEngine.getIsRunning()).toBe(true);
    customEngine.stop();
  });

  it('should default to 5000ms tick interval', () => {
    const defaultEngine = new SimulationEngine();
    defaultEngine.start();
    expect(defaultEngine.getIsRunning()).toBe(true);
    defaultEngine.stop();
  });

  it('should survive errors in tick without stopping', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Access private method via prototype to inject an error
    const proto = Object.getPrototypeOf(engine);
    const originalTick = proto.tick;

    // Temporarily make processJobTriggers throw
    (engine as any).processJobTriggers = () => {
      throw new Error('Test error');
    };

    engine.start();

    // Advance past one tick
    await vi.advanceTimersByTimeAsync(5000);

    // Engine should still be running despite the error
    expect(engine.getIsRunning()).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith(
      'Simulation tick error:',
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });

  it('should accept an onBroadcast callback', () => {
    const callback = vi.fn();
    engine.onBroadcast = callback;
    expect(engine.onBroadcast).toBe(callback);
  });

  it('should export a singleton instance', async () => {
    const { engine: singleton } = await import(
      '../../server/simulation/engine.js'
    );
    expect(singleton).toBeInstanceOf(SimulationEngine);
  });
});
