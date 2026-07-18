import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface ProductTagCopySource {
  id: string | number;
  label: string;
  tags: string[];
}

@Component({
  selector: 'app-product-tag-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-tag-input.component.html',
  styleUrl: './product-tag-input.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ProductTagInputComponent),
    multi: true
  }]
})
export class ProductTagInputComponent implements ControlValueAccessor {
  private static nextInputId = 0;

  @Input() copySources: ProductTagCopySource[] = [];

  readonly maxTags = 10;
  readonly maxTagLength = 50;
  readonly inputId = `product-tag-draft-${ProductTagInputComponent.nextInputId++}`;

  tags: string[] = [];
  draft = '';
  message = '';
  messageIsError = false;
  disabled = false;

  private initialTags: string[] = [];

  private onChange: (tags: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string[] | null | undefined): void {
    this.tags = Array.isArray(value) ? [...value] : [];
    this.initialTags = [...this.tags];
    this.draft = '';
    this.message = '';
    this.messageIsError = false;
  }

  registerOnChange(fn: (tags: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  onDraftInput(event: Event): void {
    this.draft = (event.target as HTMLInputElement).value;
    this.message = '';
    this.messageIsError = false;
  }

  onDraftKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ',') {
      return;
    }
    event.preventDefault();
    this.addDraft(false);
  }

  commitPendingTag(): boolean {
    if (!this.draft.length) {
      return true;
    }
    return this.addDraft(true);
  }

  isNewTag(tag: string): boolean {
    const key = tag.toLowerCase();
    return !this.initialTags.some((initialTag) => initialTag.toLowerCase() === key);
  }

  hasUnsavedChanges(): boolean {
    if (this.draft.length > 0 || this.tags.length !== this.initialTags.length) {
      return true;
    }
    return this.tags.some((tag, index) => tag !== this.initialTags[index]);
  }

  removeTag(index: number): void {
    if (this.disabled) {
      return;
    }
    this.updateTags(this.tags.filter((_, tagIndex) => tagIndex !== index));
    this.message = '';
    this.messageIsError = false;
  }

  copyFrom(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const source = this.copySources.find((item) => String(item.id) === select.value);
    select.value = '';
    if (!source) {
      return;
    }

    const merged = [...this.tags];
    const keys = new Set(merged.map((tag) => tag.toLowerCase()));
    let added = 0;
    let omitted = 0;
    for (const sourceTag of source.tags) {
      const normalized = this.normalize(sourceTag);
      if (!normalized || normalized.length > this.maxTagLength || keys.has(normalized.toLowerCase()) || merged.length >= this.maxTags) {
        omitted++;
        continue;
      }
      merged.push(normalized);
      keys.add(normalized.toLowerCase());
      added++;
    }
    this.updateTags(merged);
    this.messageIsError = false;
    this.message = omitted > 0
      ? `Skopiowano ${added}, pominięto ${omitted}.`
      : `Skopiowano ${added} ${added === 1 ? 'tag' : 'tagów'}.`;
  }

  markTouched(): void {
    this.onTouched();
  }

  private addDraft(validateBlank: boolean): boolean {
    const normalized = this.normalize(this.draft);
    if (!normalized) {
      if (validateBlank) {
        this.showError('Tag nie może być pusty.');
        return false;
      }
      this.draft = '';
      return true;
    }
    if (normalized.length > this.maxTagLength) {
      this.showError(`Tag może mieć maksymalnie ${this.maxTagLength} znaków.`);
      return false;
    }
    if (this.tags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
      this.showError('Ten tag został już dodany.');
      return false;
    }
    if (this.tags.length >= this.maxTags) {
      this.showError(`Możesz dodać maksymalnie ${this.maxTags} tagów.`);
      return false;
    }
    this.updateTags([...this.tags, normalized]);
    this.draft = '';
    this.messageIsError = false;
    this.message = this.tags.length >= this.maxTags
      ? `Osiągnięto limit ${this.maxTags} tagów.`
      : '';
    return true;
  }

  private normalize(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  private updateTags(tags: string[]): void {
    this.tags = tags;
    this.onChange([...tags]);
    this.onTouched();
  }

  private showError(message: string): void {
    this.message = message;
    this.messageIsError = true;
  }
}
