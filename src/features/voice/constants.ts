export const MIN_PITCH_HZ = 65
export const MAX_PITCH_HZ = 1500
export const CLARITY_THRESHOLD = 0.9
export const MIN_DURATION_MS = 2000
export const MIN_VALID_SAMPLES = 8

/**
 * Recent valid pitches are smoothed with a rolling median before they are
 * allowed to update the session min/max. This rejects single-frame outliers
 * (notably octave errors, where a detector reports half or double the real
 * pitch) that would otherwise permanently corrupt the recorded extreme.
 */
export const SMOOTHING_WINDOW = 5
export const SMOOTHING_MIN_SAMPLES = 3

/** Frames quieter than this (relative to the loudest possible sample) are ignored. */
export const MIN_VOLUME_DECIBELS = -45
