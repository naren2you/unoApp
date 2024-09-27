import { Injectable } from '@angular/core';
import { Card } from '../../models/card';

@Injectable({
  providedIn: 'root',
})
export class DeckService {
  private deck: Card[] = [];

  constructor() {
    this.createDeck();
    this.shuffleDeck();
  }

  private createDeck() {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const values = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'Skip',
      'Reverse',
      'Draw Two',
    ];

    for (const color of colors) {
      for (const value of values) {
        this.deck.push({ color, value });
        if (value !== '0') {
          this.deck.push({ color, value });
        }
      }
    }

    // Add Wild and Wild Draw Four cards
    for (let i = 0; i < 4; i++) {
      this.deck.push({ color: 'black', value: 'Wild' });
      this.deck.push({ color: 'black', value: 'Wild Draw Four' });
    }
  }

  private shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  drawCard(): Card | undefined {
    return this.deck.pop();
  }

  get remainingCards(): number {
    return this.deck.length;
  }
}
