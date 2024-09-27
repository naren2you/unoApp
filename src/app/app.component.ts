import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {
  Component,
  OnInit,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Card } from './models/card';
import { GameService } from './services/game/game.service';
import { CardComponent } from './components/card/card.component';
import { PlayerHandComponent } from './components/playerHand/player-hand/player-hand.component';
import { StatusBarComponent } from './components/statusBar/status-bar/status-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, CardComponent, PlayerHandComponent, StatusBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, AfterViewInit {
  playerHands: Card[][] = [];
  currentCard: Card | null = null;
  currentPlayerIndex: number = 0;
  isSelectingColor: boolean = false;
  unoCalled: boolean = false;

  constructor(
    private gameService: GameService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTooltips();
    }
  }

  private initializeTooltips() {
    import('bootstrap').then((bootstrap) => {
      const tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
      );
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
          trigger: 'hover',
          delay: { show: 500, hide: 100 },
        });
      });
    });
  }

  ngOnInit() {
    this.gameService.initializeGame(4); // Initialize game with 4 players
    this.updateGameState();

    this.gameService.currentCard$.subscribe((card) => {
      this.currentCard = card;
    });

    this.gameService.currentPlayerIndex$.subscribe((index) => {
      this.currentPlayerIndex = index;
    });

    this.gameService.colorSelection$.subscribe(() => {
      this.isSelectingColor = true;
    });

    this.gameService.unoCalled$.subscribe((called) => {
      this.unoCalled = called;
    });

    this.gameService.penalty$.subscribe((playerIndex) => {
      alert(`Player ${playerIndex + 1} drew 2 cards as a penalty!`);
      this.updateGameState();
    });
  }

  private updateGameState() {
    for (let i = 0; i < 4; i++) {
      this.playerHands[i] = this.gameService.getPlayerHand(i);
    }
  }

  playCard(playerIndex: number, cardIndex: number) {
    if (this.gameService.playCard(playerIndex, cardIndex)) {
      this.updateGameState();
      this.checkWinner();
    }
  }
  drawCard() {
    this.gameService.drawCard(this.currentPlayerIndex);
    this.updateGameState();
  }

  selectColor(color: string) {
    this.gameService.selectColor(color);
    this.isSelectingColor = false;
    this.updateGameState();
  }

  callUno() {
    this.gameService.callUno(this.currentPlayerIndex);
  }

  canCallUno(): boolean {
    return (
      this.playerHands[this.currentPlayerIndex].length === 2 && !this.unoCalled
    );
  }

  private checkWinner() {
    const winnerIndex = this.gameService.checkWinner();
    if (winnerIndex !== null) {
      alert(`Player ${winnerIndex + 1} wins!`);
      // You might want to reset the game or show a game over screen here
    }
  }
}
