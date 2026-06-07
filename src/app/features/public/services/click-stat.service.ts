import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ClickStatService {
  private readonly apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') backendUrl: string
  ) {
    this.apiUrl = `${backendUrl}/api/public/click-stats`;
  }

  recordClick(entityType: string, entityId: number): void {
    if (!entityType?.trim() || entityId == null) {
      console.error('[ClickStat] Invalid payload', { entityType, entityId });
      return;
    }

    const payload = { entityType: entityType.trim(), entityId };
    console.log('[ClickStat] POST', this.apiUrl, payload);

    this.http.post(this.apiUrl, payload, { responseType: 'text' }).subscribe({
      next: () => console.log('[ClickStat] OK', payload),
      error: (err) => console.error('[ClickStat] FAILED', payload, err)
    });
  }
}
