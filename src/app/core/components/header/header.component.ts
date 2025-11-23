import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LinkService, LinkDTO } from '../../services/link.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  links: LinkDTO[] = [];

  constructor(private linkService: LinkService) {}

  ngOnInit(): void {
    this.linkService.getSocialLinks().subscribe({
      next: (data) => this.links = data,
      error: (err) => console.error('Error fetching links:', err)
    });
  }

  getPlatform(url: string): string {
    const lower = url.toLowerCase();
    if (lower.includes("tiktok")) return "tiktok";
    if (lower.includes("instagram")) return "instagram";
    if (lower.includes("facebook")) return "facebook";
    if (lower.includes("youtube")) return "youtube";
    return "default";
  }

  getIconPath(url: string): string {
    return 'assets/icons/' + this.getPlatform(url) + '.png';
  }
}
