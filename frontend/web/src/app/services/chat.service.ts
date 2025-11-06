import { Injectable } from '@angular/core';

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatResponse {
  reply: string;
  raw?: unknown;
}

interface OpenAIChoice {
  message?: {
    role?: string;
    content?: string;
  };
  delta?: {
    content?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly baseUrl = 'http://0.0.0.0:9000/v1/chat/completions';

  async converse(modelId: string, messages: ChatMessage[]): Promise<ChatResponse> {
    const payload = {
      model: modelId,
      messages
    };
    const url = this.baseUrl;

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

      const contentType = response.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        const data = await response.json();
        const reply = this.extractReply(data);
        return { reply, raw: data };
      }

      const text = await response.text();
      return { reply: text.trim() || '...', raw: text };
    } catch (error) {
      return {
        reply:
          'Ich kann gerade keine Verbindung zum KI-Modell aufbauen. Bitte versuche es in einem Moment erneut.',
        raw: { error: (error as Error).message }
      };
    }
  }

  private extractReply(payload: any): string {
    if (!payload) {
      return '…';
    }

    if (typeof payload.reply === 'string') {
      return payload.reply;
    }

    const choices = payload.choices as OpenAIChoice[] | undefined;
    if (Array.isArray(choices) && choices.length > 0) {
      const first = choices[0];
      const content = first?.message?.content ?? first?.delta?.content;
      if (content) {
        return String(content).trim();
      }
    }

    if (typeof payload === 'object') {
      return JSON.stringify(payload);
    }

    return String(payload);
  }
}
