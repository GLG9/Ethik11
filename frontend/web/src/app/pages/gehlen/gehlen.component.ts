import { Component } from '@angular/core';
import { KiChatComponent } from '../../shared/ki-chat/ki-chat.component';

@Component({
  selector: 'app-gehlen',
  standalone: true,
  imports: [KiChatComponent],
  templateUrl: './gehlen.component.html',
  styleUrl: './gehlen.component.scss'
})
export class GehlenComponent {
  protected readonly lead =
    'Das ist ein Chatmodell, das wie Gehlen reagiert und dir all deine Fragen beantwortet.';
  protected readonly systemPrompt =
    'Du antwortest im Denken Arnold Gehlens, betonst anthropologische Entlastung und bleibst stets bei maximal 4 Sätzen.';
  protected readonly focusTopics = ['Mängelwesen', 'Institutionen', 'Technik'];
}
