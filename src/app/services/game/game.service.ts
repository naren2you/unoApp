import { Card } from './../../models/card';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { DeckService } from '../deck/deck.service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private currentPlayerIndex = 0;
  private players: Card[][] = [];
  private discardPile: Card[] = [];
  private direction = 1; // 1 for clockwise, -1 for counterclockwise
  private readonly WINNING_SCORE = 500;

  private roundScoresSubject = new BehaviorSubject<number[]>([]);
  roundScores$ = this.roundScoresSubject.asObservable();

  private totalScoresSubject = new BehaviorSubject<number[]>([]);
  totalScores$ = this.totalScoresSubject.asObservable();

  private gameOverSubject = new Subject<number>(); // Emits winner index
  gameOver$ = this.gameOverSubject.asObservable();

  private roundNumberSubject = new BehaviorSubject<number>(1);
  roundNumber$ = this.roundNumberSubject.asObservable();

  private directionSubject = new BehaviorSubject<string>('Clockwise');
  direction$ = this.directionSubject.asObservable();

  private specialActionSubject = new Subject<string>();
  specialAction$ = this.specialActionSubject.asObservable();

  private currentCardSubject = new BehaviorSubject<Card | null>(null);
  currentCard$ = this.currentCardSubject.asObservable();

  private currentPlayerIndexSubject = new BehaviorSubject<number>(0);
  currentPlayerIndex$ = this.currentPlayerIndexSubject.asObservable();

  private colorSelectionSubject = new Subject<void>();
  colorSelection$ = this.colorSelectionSubject.asObservable();

  private selectedColorSubject = new BehaviorSubject<string | null>(null);
  selectedColor$ = this.selectedColorSubject.asObservable();

  private unoCalledSubject = new BehaviorSubject<boolean>(false);
  unoCalled$ = this.unoCalledSubject.asObservable();

  private penaltySubject = new Subject<number>();
  penalty$ = this.penaltySubject.asObservable();

  constructor(private deckService: DeckService) {}

  initializeGame(numPlayers: number) {
    this.players = Array(numPlayers)
      .fill(null)
      .map(() => []);
    this.totalScoresSubject.next(new Array(numPlayers).fill(0));
    this.startNewRound();
  }

  private startNewRound() {
    this.dealInitialHands();
    this.discardPile = [this.deckService.drawCard()!];
    this.currentCardSubject.next(this.discardPile[this.discardPile.length - 1]);
    this.currentPlayerIndex = 0;
    this.currentPlayerIndexSubject.next(this.currentPlayerIndex);
    this.direction = 1;
    this.directionSubject.next('Clockwise');
    this.roundScoresSubject.next(new Array(this.players.length).fill(0));
    this.roundNumberSubject.next(this.roundNumberSubject.getValue() + 1);
  }

  private dealInitialHands() {
    for (let i = 0; i < 7; i++) {
      for (let player of this.players) {
        const card = this.deckService.drawCard();
        if (card) player.push(card);
      }
    }
  }

  playCard(playerIndex: number, cardIndex: number) {
    if (playerIndex !== this.currentPlayerIndex) return false;

    const player = this.players[playerIndex];
    const card = player[cardIndex];

    if (player.length === 1 && !this.unoCalledSubject.getValue()) {
      // Player forgot to call UNO, apply penalty
      this.applyUnoPenalty(playerIndex);
    }
    // Reset UNO call status for the next turn
    this.unoCalledSubject.next(false);

    if (this.isValidPlay(card)) {
      player.splice(cardIndex, 1);
      this.discardPile.push(card);
      this.currentCardSubject.next(card);

      switch (card.value) {
        case 'Skip':
          this.skipNextPlayer();
          break;
        case 'Reverse':
          this.reverseDirection();
          break;
        case 'Draw Two':
          this.drawTwoForNextPlayer();
          break;
        case 'Wild Draw Four':
          this.wildDrawFour();
          this.colorSelectionSubject.next();
          return true; // Don't proceed with next turn yet
        case 'Wild':
          this.chooseColor(card);
          break;
        default:
          this.nextTurn();
      }

      if (player.length === 0) {
        this.endRound(playerIndex);
      }

      return true;
    }

    return false;
  }

  private endRound(winnerIndex: number) {
    const scores = this.calculateScores(winnerIndex);
    this.roundScoresSubject.next(scores);

    const totalScores = this.totalScoresSubject.getValue();
    for (let i = 0; i < scores.length; i++) {
      totalScores[i] += scores[i];
    }
    this.totalScoresSubject.next(totalScores);

    if (totalScores[winnerIndex] >= this.WINNING_SCORE) {
      this.gameOverSubject.next(winnerIndex);
    } else {
      this.startNewRound();
    }
  }

  private calculateScores(winnerIndex: number): number[] {
    const scores = new Array(this.players.length).fill(0);
    for (let i = 0; i < this.players.length; i++) {
      if (i !== winnerIndex) {
        scores[winnerIndex] += this.players[i].reduce(
          (sum, card) => sum + this.getCardValue(card),
          0
        );
      }
    }
    return scores;
  }

  private getCardValue(card: Card): number {
    switch (card.value) {
      case 'Skip':
      case 'Reverse':
      case 'Draw Two':
        return 20;
      case 'Wild':
      case 'Wild Draw Four':
        return 50;
      default:
        return parseInt(card.value) || 0;
    }
  }

  callUno(playerIndex: number) {
    if (
      playerIndex === this.currentPlayerIndex &&
      this.players[playerIndex].length === 2
    ) {
      this.unoCalledSubject.next(true);
    } else {
      // Player called UNO incorrectly, apply penalty
      this.applyUnoPenalty(playerIndex);
    }
  }

  private applyUnoPenalty(playerIndex: number) {
    this.drawCards(playerIndex, 2);
    this.penaltySubject.next(playerIndex);
  }

  selectColor(color: string) {
    const currentCard = this.discardPile[this.discardPile.length - 1];
    currentCard.color = color;
    this.selectedColorSubject.next(color);
    this.currentCardSubject.next(currentCard);

    if (currentCard.value === 'Wild Draw Four') {
      this.drawTwoForNextPlayer();
    }

    this.nextTurn();
  }

  private skipNextPlayer() {
    this.specialActionSubject.next('Player Skipped');
    this.nextTurn();
    this.nextTurn(); // Skip the next player
  }

  private reverseDirection() {
    this.direction *= -1;
    this.directionSubject.next(
      this.direction === 1 ? 'Clockwise' : 'Counterclockwise'
    );
    this.specialActionSubject.next('Direction Reversed');
    if (this.players.length === 2) {
      this.skipNextPlayer(); // In a two-player game, reverse acts like skip
    } else {
      this.nextTurn();
    }
  }

  private drawTwoForNextPlayer() {
    this.specialActionSubject.next('Next Player Draws 2 Cards');
    const nextPlayerIndex = this.getNextPlayerIndex();
    this.drawCards(nextPlayerIndex, 2);
    this.skipNextPlayer();
  }

  private wildDrawFour() {
    this.specialActionSubject.next('Next Player Draws 4 Cards');
    const nextPlayerIndex = this.getNextPlayerIndex();
    this.drawCards(nextPlayerIndex, 4);
    this.chooseColor(this.discardPile[this.discardPile.length - 1]);
    this.skipNextPlayer();
  }

  private chooseColor(card: Card) {
    // For now, we'll just randomly choose a color
    // In a real game, you'd want to prompt the user to choose
    const colors = ['red', 'blue', 'green', 'yellow'];
    card.color = colors[Math.floor(Math.random() * colors.length)];
    this.nextTurn();
  }

  private drawCards(playerIndex: number, count: number) {
    for (let i = 0; i < count; i++) {
      const card = this.deckService.drawCard();
      if (card) this.players[playerIndex].push(card);
    }
  }

  private getNextPlayerIndex(): number {
    return (
      (this.currentPlayerIndex + this.direction + this.players.length) %
      this.players.length
    );
  }

  private isValidPlay(card: Card): boolean {
    const topCard = this.discardPile[this.discardPile.length - 1];
    return (
      card.color === topCard.color ||
      card.value === topCard.value ||
      card.color === 'black'
    );
  }

  private nextTurn() {
    this.currentPlayerIndex = this.getNextPlayerIndex();
    this.currentPlayerIndexSubject.next(this.currentPlayerIndex);
  }

  drawCard(playerIndex: number) {
    if (playerIndex !== this.currentPlayerIndex) return;

    const card = this.deckService.drawCard();
    if (card) {
      this.players[playerIndex].push(card);
      this.nextTurn();
    }
  }

  getPlayerHand(playerIndex: number): Card[] {
    return this.players[playerIndex];
  }

  getCurrentPlayerIndex(): number {
    return this.currentPlayerIndex;
  }

  checkWinner(): number | null {
    const winnerIndex = this.players.findIndex((player) => player.length === 0);
    return winnerIndex >= 0 ? winnerIndex : null;
  }
}
