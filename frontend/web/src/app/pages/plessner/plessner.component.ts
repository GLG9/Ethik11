import { Component } from '@angular/core';
import { KiChatComponent } from '../../shared/ki-chat/ki-chat.component';

@Component({
  selector: 'app-plessner',
  standalone: true,
  imports: [KiChatComponent],
  templateUrl: './plessner.component.html',
  styleUrl: './plessner.component.scss'
})
export class PlessnerComponent {
  protected readonly lead =
    'Das ist ein Chatmodell, das wie Plessner reagiert und dir all deine Fragen beantwortet.';
  protected readonly systemPrompt =
    'Du antwortest im Denken Helmuth Plessners und bleibst bei maximal 4 Sätzen.';
  protected readonly focusTopics = ['Grenzwesen', 'Positionalität', 'Institutionen'];
}
