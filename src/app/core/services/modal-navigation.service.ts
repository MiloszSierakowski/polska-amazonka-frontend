import { Injectable, OnDestroy } from '@angular/core';

interface ModalNavigationEntry {
  id: number;
  close: () => void;
  previousState: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class ModalNavigationService implements OnDestroy {
  private readonly stack: ModalNavigationEntry[] = [];
  private nextId = 0;

  constructor() {
    window.addEventListener('popstate', this.handlePopState);
  }

  ngOnDestroy(): void {
    window.removeEventListener('popstate', this.handlePopState);
  }

  open(closeCallback: () => void): number {
    const id = ++this.nextId;
    const previousState = window.history.state ?? null;
    const baseState =
      typeof previousState === 'object' && previousState !== null
        ? previousState as Record<string, unknown>
        : {};
    this.stack.push({ id, close: closeCallback, previousState });
    window.history.pushState(
      { ...baseState, modalNavigationId: id },
      '',
      window.location.href
    );
    return id;
  }

  close(id: number | null): null {
    if (id == null) {
      return null;
    }
    const index = this.stack.findIndex((entry) => entry.id === id);
    if (index === -1) {
      return null;
    }
    const [entry] = this.stack.splice(index, 1);
    window.history.replaceState(entry.previousState, '', window.location.href);
    return null;
  }

  unregister(id: number | null): null {
    if (id == null) {
      return null;
    }
    const index = this.stack.findIndex((entry) => entry.id === id);
    if (index !== -1) {
      this.stack.splice(index, 1);
    }
    return null;
  }

  private readonly handlePopState = (): void => {
    const entry = this.stack.pop();
    if (entry) {
      entry.close();
    }
  };
}
