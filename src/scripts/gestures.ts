import { gestureSettings } from '../config/gestures';

export type GestureDirection = 'up' | 'down' | 'left' | 'right';
type GestureAxis = 'x' | 'y';
type GestureAction = () => void;
type GestureActions = Partial<Record<GestureDirection, GestureAction>>;
type GestureOptions = Partial<typeof gestureSettings> & {
  actions: GestureActions;
  zones?: { element: Element; actions: GestureActions; thresholdPx?: number; touchThresholdPx?: number }[];
  touchRoot?: HTMLElement;
  horizontalThresholdPx?: number;
  horizontalWheelLockMs?: number;
  touchHorizontalThresholdPx?: number;
  // The homepage historically requires a single intentional wheel event.
  accumulate?: boolean;
  initialWheelAt?: number;
};

export function normalizedWheelDelta(event: WheelEvent, axis: GestureAxis) {
  const value = axis === 'x' ? event.deltaX : event.deltaY;
  const pageSize = axis === 'x' ? innerWidth : innerHeight;
  return event.deltaMode === WheelEvent.DOM_DELTA_LINE ? value * 16
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? value * pageSize : value;
}

let horizontalWheelLockedUntil = -Infinity;

/** One listener owns both axes and all zones, so a diagonal gesture has one destination. */
export function listenToGestures(options: GestureOptions) {
  const settings = { ...gestureSettings, ...options };
  let lastAt = options.initialWheelAt ?? -Infinity;
  let lastMagnitude = 0;
  // An early input captured by the inline home bootstrap already caused its move.
  let cooldownUntil = options.initialWheelAt === undefined ? -Infinity : options.initialWheelAt + settings.cooldownMs;
  let axis: GestureAxis | undefined;
  let actions: GestureActions = options.actions;
  let threshold = settings.thresholdPx;
  let amount = 0;
  let fired = options.initialWheelAt !== undefined;
  let touchStart: { x: number; y: number; actions: GestureActions; threshold: number } | undefined;

  const contextFor = (target: EventTarget | null) => {
    const zone = options.zones?.find(({ element }) => target instanceof Node && element.contains(target));
    return {
      actions: zone?.actions ?? options.actions,
      threshold: zone?.thresholdPx ?? settings.thresholdPx,
      touchThreshold: zone?.touchThresholdPx ?? settings.touchThresholdPx,
    };
  };
  const reset = (target: EventTarget | null) => {
    axis = undefined;
    amount = 0;
    fired = false;
    ({ actions, threshold } = contextFor(target));
  };
  const directionFor = (chosenAxis: GestureAxis, value: number): GestureDirection =>
    chosenAxis === 'y' ? (value > 0 ? 'down' : 'up') : (value > 0 ? 'right' : 'left');

  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) return;
    event.preventDefault();
    const x = normalizedWheelDelta(event, 'x');
    const y = normalizedWheelDelta(event, 'y');
    const magnitude = Math.max(Math.abs(x), Math.abs(y));
    if (magnitude === 0) return;
    const now = performance.now();
    if (options.horizontalWheelLockMs && now < horizontalWheelLockedUntil &&
      (axis === 'x' || Math.abs(x) >= Math.abs(y) * settings.axisRatio)) {
      horizontalWheelLockedUntil = Math.max(horizontalWheelLockedUntil, now + settings.releaseGapMs);
      return;
    }
    const gap = now - lastAt;
    const fresh = gap >= (fired ? settings.releaseGapMs : settings.gestureGapMs) && now >= cooldownUntil;
    const notch = event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL || magnitude >= settings.notchMagnitudePx;
    const separateNotch = fired && notch && gap >= settings.notchGapMs && now >= cooldownUntil;
    const renewed = fired && now >= cooldownUntil && magnitude >= settings.renewedImpulsePx
      && magnitude >= lastMagnitude * settings.impulseRatio && gap >= settings.notchGapMs;
    if (fresh || separateNotch || renewed) reset(event.target);
    lastAt = now;
    lastMagnitude = magnitude;
    if (fired) return;

    if (!axis) {
      if (Math.abs(x) >= Math.abs(y) * settings.axisRatio && Math.abs(x) >= 3) axis = 'x';
      else if (Math.abs(y) >= Math.abs(x) * settings.axisRatio && Math.abs(y) >= 3) axis = 'y';
      else if (magnitude >= threshold) axis = Math.abs(x) > Math.abs(y) ? 'x' : 'y';
      else return;
    }
    const delta = axis === 'x' ? x : y;
    if (Math.abs(delta) < 1) return;
    amount = settings.accumulate === false ? delta : amount + delta;
    if (Math.abs(amount) < (axis === 'x' ? options.horizontalThresholdPx ?? threshold : threshold)) return;
    fired = true;
    cooldownUntil = now + settings.cooldownMs;
    if (axis === 'x' && options.horizontalWheelLockMs) {
      horizontalWheelLockedUntil = now + options.horizontalWheelLockMs;
    }
    actions[directionFor(axis, amount)]?.();
  };

  // Touch displacement uses the direction of the finger horizontally, and
  // the direction of content travel vertically (swipe up advances down).
  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) { touchStart = undefined; return; }
    const touch = event.changedTouches[0];
    if (!touch) return;
    const context = contextFor(event.target);
    touchStart = { x: touch.clientX, y: touch.clientY, actions: context.actions, threshold: context.touchThreshold };
  };
  const onTouchEnd = (event: TouchEvent) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStart.x;
    const dy = touchStart.y - touch.clientY;
    const chosenAxis: GestureAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    const delta = chosenAxis === 'x' ? dx : dy;
    if (Math.abs(delta) >= (chosenAxis === 'x' ? options.touchHorizontalThresholdPx ?? settings.touchThresholdPx : touchStart.threshold)) {
      const action = touchStart.actions[directionFor(chosenAxis, delta)];
      if (action) { event.preventDefault(); action(); }
    }
    touchStart = undefined;
  };

  window.addEventListener('wheel', onWheel, { passive: false, capture: true });
  options.touchRoot?.addEventListener('touchstart', onTouchStart, { passive: true });
  options.touchRoot?.addEventListener('touchend', onTouchEnd, { passive: false });
  return () => {
    window.removeEventListener('wheel', onWheel, true);
    options.touchRoot?.removeEventListener('touchstart', onTouchStart);
    options.touchRoot?.removeEventListener('touchend', onTouchEnd);
    touchStart = undefined;
  };
}
