import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Card } from '../../../models/card';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../card/card.component';

@Component({
  selector: 'app-player-hand',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './player-hand.component.html',
  styleUrl: './player-hand.component.scss',
})
export class PlayerHandComponent {
  @Input() cards: Card[] = [];
  @Input() isCurrentPlayer: boolean = false;
  @Output() cardPlayed = new EventEmitter<number>();

  playCard(index: number) {
    if (this.isCurrentPlayer) {
      this.cardPlayed.emit(index);
    }
  }
}
