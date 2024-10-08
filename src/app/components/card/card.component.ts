import {
  Component,
  Input,
  AfterViewInit,
  ElementRef,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Card } from '../../models/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent implements AfterViewInit {
  @Input() card!: Card;
  private tooltip: any;
  constructor(
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && this.isSpecialCard()) {
      this.initializeTooltip();
    }
  }

  private initializeTooltip() {
    import('bootstrap').then((bootstrap) => {
      this.tooltip = new bootstrap.Tooltip(
        this.elementRef.nativeElement.querySelector('.card'),
        {
          trigger: 'manual',
          html: true,
        }
      );

      this.elementRef.nativeElement.addEventListener('mouseenter', () => {
        this.tooltip.show();
        setTimeout(() => this.tooltip.hide(), 2000); // Hide after 2 seconds
      });

      this.elementRef.nativeElement.addEventListener('mouseleave', () => {
        this.tooltip.hide();
      });
    });
  }

  get textColor(): string {
    return this.card.color === 'yellow' ? 'black' : 'white';
  }

  isSpecialCard(): boolean {
    return ['Skip', 'Reverse', 'Draw Two', 'Wild', 'Wild Draw Four'].includes(
      this.card.value
    );
  }

  get cardIcon(): string {
    switch (this.card.value) {
      case 'Skip':
        return 'bi bi-slash-circle';
      case 'Reverse':
        return 'bi bi-arrow-repeat';
      case 'Draw Two':
        return 'bi bi-plus-circle';
      case 'Wild':
        return 'bi bi-palette';
      case 'Wild Draw Four':
        return 'bi bi-plus-square';
      default:
        return '';
    }
  }

  get tooltipText(): string {
    switch (this.card.value) {
      case 'Skip':
        return "Skip the next player's turn";
      case 'Reverse':
        return 'Reverse the direction of play';
      case 'Draw Two':
        return 'Next player draws 2 cards and loses their turn';
      case 'Wild':
        return 'Change the current color';
      case 'Wild Draw Four':
        return 'Change the current color and next player draws 4 cards';
      default:
        return '';
    }
  }
}
