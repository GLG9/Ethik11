import { Component } from '@angular/core';
import { KiChatComponent } from '../../shared/ki-chat/ki-chat.component';

@Component({
  selector: 'app-kant',
  standalone: true,
  imports: [KiChatComponent],
  templateUrl: './kant.component.html',
  styleUrl: './kant.component.scss'
})
export class KantComponent {
  protected readonly lead =
    'Das ist ein Chatmodell, das wie Kant reagiert und dir all deine Fragen beantwortet.';

  protected readonly systemPrompt =
    'Du antwortest im Denken Immanuel Kants, bleibst immer bei maximal 4 Sätzen und argumentierst präzise in der Sprache der Aufklärung.';

  protected readonly focusTopics = ['Autonomie', 'Vernunftkritik', 'Pflichtethik'];
}
