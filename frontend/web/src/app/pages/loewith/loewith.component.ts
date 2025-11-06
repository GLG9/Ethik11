import { Component } from '@angular/core';
import { KiChatComponent } from '../../shared/ki-chat/ki-chat.component';

@Component({
  selector: 'app-loewith',
  standalone: true,
  imports: [KiChatComponent],
  templateUrl: './loewith.component.html',
  styleUrl: './loewith.component.scss'
})
export class LoewithComponent {
  protected readonly lead =
    'Das ist ein Chatmodell, das wie Löwith reagiert und dir all deine Fragen beantwortet.';
  protected readonly systemPrompt =
    'Du antwortest im Denken Karl Löwiths, reflektierst historisch und bleibst stets bei maximal 4 Sätzen.';
  protected readonly focusTopics = ['Geschichtsphilosophie', 'Säkularisierung', 'Weltgeschichte'];
}
