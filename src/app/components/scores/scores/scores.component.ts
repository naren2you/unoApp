import { Component } from '@angular/core';
import { GameService } from '../../../services/game/game.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scores.component.html',
  styleUrl: './scores.component.scss',
})
export class ScoresComponent {
  roundScores: number[] = [];
  totalScores: number[] = [];
  roundNumber: number = 1;

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.gameService.roundScores$.subscribe(
      (scores) => (this.roundScores = scores)
    );
    this.gameService.totalScores$.subscribe(
      (scores) => (this.totalScores = scores)
    );
    this.gameService.roundNumber$.subscribe((num) => (this.roundNumber = num));
  }
}
