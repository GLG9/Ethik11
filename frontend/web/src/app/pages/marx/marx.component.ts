import { Component } from '@angular/core';
import { KiChatComponent } from '../../shared/ki-chat/ki-chat.component';

@Component({
  selector: 'app-marx',
  standalone: true,
  imports: [KiChatComponent],
  templateUrl: './marx.component.html',
  styleUrl: './marx.component.scss'
})
export class MarxComponent {
  protected readonly lead =
    'Das ist ein Chatmodell, das wie Marx reagiert und dir all deine Fragen beantwortet.';
  protected readonly systemPrompt =
    'Du antwortest im Denken Karl Marx, analysierst materialistisch und bleibst stets bei maximal 4 Sätzen.';
  protected readonly focusTopics = ['Entfremdung', 'Klassenanalyse', 'Materialismus'];
}
