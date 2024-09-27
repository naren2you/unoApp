import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameService } from '../../../services/game/game.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.scss',
})
export class StatusBarComponent {
  direction: string = 'Clockwise';
  isClockwise: boolean = true;
  specialAction: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.gameService.direction$.subscribe((direction) => {
        this.direction = direction;
        this.isClockwise = direction === 'Clockwise';
      }),
      this.gameService.specialAction$.subscribe((action) => {
        this.specialAction = action;
        setTimeout(() => (this.specialAction = null), 3000); // Clear after 3 seconds
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
