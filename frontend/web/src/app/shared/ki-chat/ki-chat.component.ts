import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { nanoid } from '../../utils/nanoid';
import { ChatMessage, ChatService, StreamEvent } from '../../services/chat.service';
import { ProgressService } from '../../services/progress.service';

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  pending?: boolean;
  error?: boolean;
}

@Component({
  selector: 'app-ki-chat',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, ReactiveFormsModule, DatePipe],
  templateUrl: './ki-chat.component.html',
  styleUrl: './ki-chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KiChatComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly chatService = inject(ChatService);
  private readonly progressService = inject(ProgressService);

  @Input({ required: true }) modelId!: string;
  @Input({ required: true }) displayName!: string;
  @Input() lead = '';
  @Input() focusTopics: string[] = [];
  @Input({ required: true }) systemPrompt!: string;

  @ViewChild('thread', { static: true }) private thread?: ElementRef<HTMLDivElement>;

  readonly form = this.fb.nonNullable.group({
    prompt: ['', [Validators.required, Validators.maxLength(2500)]]
  });

  readonly messages: UiMessage[] = [];

  private conversation: ChatMessage[] = [];
  private systemMessage: ChatMessage | null = null;

  ngOnInit(): void {
    if (!this.displayName) {
      this.displayName = 'KI-Modell';
    }

    if (!this.systemPrompt) {
      this.systemPrompt = `Du antwortest als ${this.displayName}.`;
    }

    this.systemMessage = { role: 'system', content: this.systemPrompt };

    this.pushAssistant(
      `Ich bin ${this.displayName}. Stelle mir deine Fragen, und ich antworte mit klaren ethischen Perspektiven.`
    );
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.form.disabled) {
      return;
    }

    const prompt = this.form.controls.prompt.value.trim();
    if (!prompt) {
      return;
    }

    this.form.disable();

    const userUiMessage: UiMessage = {
      id: nanoid(),
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };

    this.messages.push(userUiMessage);
    this.form.reset();
    this.scrollToBottom();

    const assistantMessage: UiMessage = {
      id: nanoid(),
      role: 'assistant',
      content: '…',
      pending: true,
      timestamp: new Date()
    };

    this.messages.push(assistantMessage);
    this.scrollToBottom();

    const userChat: ChatMessage = { role: 'user', content: prompt };
    const requestMessages: ChatMessage[] = [
      ...(this.systemMessage ? [this.systemMessage] : []),
      ...this.conversation,
      userChat
    ];

    const handleStream = (event: StreamEvent) => {
      if (event.type === 'delta') {
        if (assistantMessage.pending) {
          assistantMessage.pending = false;
          assistantMessage.content = '';
        }
        assistantMessage.content += event.text;
        this.scrollToBottom();
      } else if (event.type === 'error') {
        assistantMessage.pending = false;
        assistantMessage.error = true;
        assistantMessage.content = event.error;
      }
    };

    try {
      const reply = await this.chatService.converse(this.modelId, requestMessages, handleStream);
      assistantMessage.pending = false;
      if (!assistantMessage.error) {
        if (!assistantMessage.content || assistantMessage.content === '…') {
          assistantMessage.content = reply;
        }
        this.conversation.push(userChat, { role: 'assistant', content: assistantMessage.content });
        this.progressService.markVisited(this.modelId);
      } else {
        this.conversation.push(userChat);
      }
    } catch (error) {
      assistantMessage.content = 'Die Antwort konnte nicht geladen werden. Bitte versuche es später erneut.';
      assistantMessage.pending = false;
      assistantMessage.error = true;
      this.conversation.push(userChat);
    } finally {
      this.form.enable();
      this.scrollToBottom();
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submit();
    }
  }

  private pushAssistant(content: string): void {
    this.messages.push({
      id: nanoid(),
      role: 'assistant',
      content,
      timestamp: new Date()
    });
  }

  private scrollToBottom(): void {
    queueMicrotask(() => {
      if (!this.thread) {
        return;
      }
      const el = this.thread.nativeElement;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }
}
