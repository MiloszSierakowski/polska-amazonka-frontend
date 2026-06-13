import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'urlFormatter',
  standalone: true
})
export class UrlFormatterPipe implements PipeTransform {
  private readonly urlPattern = /https?:\/\/[^\s<>"']+/gi;

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }

    let result = '';
    let lastIndex = 0;
    const text = String(value);

    for (const match of text.matchAll(this.urlPattern)) {
      const rawUrl = match[0];
      const start = match.index ?? 0;
      const { url, suffix } = this.splitTrailingPunctuation(rawUrl);

      result += this.escapeHtml(text.slice(lastIndex, start));
      result += this.formatLink(url);
      result += this.escapeHtml(suffix);
      lastIndex = start + rawUrl.length;
    }

    result += this.escapeHtml(text.slice(lastIndex));
    return this.sanitizer.bypassSecurityTrustHtml(result);
  }

  private splitTrailingPunctuation(rawUrl: string): { url: string; suffix: string } {
    let url = rawUrl;
    let suffix = '';

    while (/[),.;:!?]$/.test(url)) {
      suffix = url.slice(-1) + suffix;
      url = url.slice(0, -1);
    }

    return { url, suffix };
  }

  private formatLink(url: string): string {
    const safeUrl = this.escapeAttribute(url);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="changelog-inline-link">[Link]</a>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeAttribute(value: string): string {
    return this.escapeHtml(value).replace(/`/g, '&#96;');
  }
}
