import { Injectable } from '@angular/core';

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; error: string };

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly baseUrl = '/api/chat';

  async converse(
    modelId: string,
    messages: ChatMessage[],
    onEvent?: (event: StreamEvent) => void
  ): Promise<string> {
    const payload = {
      messages,
      temperature: 0.35
    };
    const url = `${this.baseUrl}/${encodeURIComponent(modelId)}/`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server antwortete mit Status ${response.status}`);
      }

      const data = await response.json();
      const reply = this.extractReply(data);
      onEvent?.({ type: 'delta', text: reply });
      onEvent?.({ type: 'done' });
      return reply;
    } catch (error) {
      const fallback =
        'Ich kann gerade keine Verbindung zum KI-Modell aufbauen. Bitte versuche es in einem Moment erneut.';
      onEvent?.({ type: 'delta', text: fallback });
      onEvent?.({ type: 'done' });
      return fallback;
    }
  }

  private extractReply(payload: any): string {
    if (!payload) {
      return '…';
    }

    if (typeof payload.reply === 'string') {
      return payload.reply;
    }

    const choices = payload.choices as Array<{ message?: { content?: string }; delta?: { content?: string } }> | undefined;
    if (Array.isArray(choices) && choices.length > 0) {
      const first = choices[0];
      const content = first?.message?.content ?? first?.delta?.content;
      if (typeof content === 'string') {
        return content.trim();
      }
    }

    if (typeof payload === 'object') {
      return JSON.stringify(payload);
    }

    return String(payload);
  }
}
