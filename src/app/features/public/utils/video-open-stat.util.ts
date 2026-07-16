import { VideoModalVariant } from '../components/video-modal/video-modal.component';

export type AppNavigationTrigger = 'imperative' | 'popstate' | 'hashchange';

export type VideoOpenSource = 'tile';
export interface VideoRouteNavigationState {
  modalVariant?: VideoModalVariant;
  videoOpenSource?: VideoOpenSource;
}

export function shouldRecordVideoOpenStat(
  state: VideoRouteNavigationState | undefined,
  navigationTrigger: AppNavigationTrigger
): boolean {
  if (navigationTrigger === 'popstate') {
    return false;
  }  if (state?.videoOpenSource === 'tile') {
    return true;
  }
  return isInitialDocumentNavigation();
}

function getNavigationTimingEntry(): PerformanceNavigationTiming | null {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') {
    return null;
  }
  const entries = performance.getEntriesByType('navigation');
  if (entries.length === 0) {
    return null;
  }
  return entries[0] as PerformanceNavigationTiming;
}

export function isDocumentReload(): boolean {
  const timing = getNavigationTimingEntry();
  return timing?.type === 'reload';
}

function isInitialDocumentNavigation(): boolean {
  const timing = getNavigationTimingEntry();
  return timing?.type === 'navigate';
}
