export const GAME_LOGICAL_WIDTH = 1280;
export const GAME_LOGICAL_HEIGHT = 768;

export interface ResponsiveViewportModel {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly scale: number;
}

export function createResponsiveViewportModel(
  viewportWidth: number,
  viewportHeight: number,
): ResponsiveViewportModel {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    throw new RangeError("Viewport width must be a finite positive number.");
  }
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) {
    throw new RangeError("Viewport height must be a finite positive number.");
  }

  const scale = Math.min(
    viewportWidth / GAME_LOGICAL_WIDTH,
    viewportHeight / GAME_LOGICAL_HEIGHT,
  );

  return {
    viewportWidth,
    viewportHeight,
    canvasWidth: GAME_LOGICAL_WIDTH * scale,
    canvasHeight: GAME_LOGICAL_HEIGHT * scale,
    scale,
  };
}
