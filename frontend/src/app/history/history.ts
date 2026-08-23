import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface FocusSession {
  id: number;
  task_id: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  task_title: string;
  task_type: string;
  activity_tag: string | null;
}

@Component({
  selector: 'app-history',
  imports: [RouterLink],
  templateUrl: './history.html',
  styleUrl: './history.css',
})

export class History implements OnInit {
  sessions: FocusSession[] = [];
  todaySessions: FocusSession[] = [];

 constructor(
  private http: HttpClient,
  private cdr: ChangeDetectorRef
) {}

  currentDate = '';

  ngOnInit() {
    this.setCurrentDate();
    this.loadSessions();
  }

  setCurrentDate() {
  const today = new Date();

  this.currentDate = today.toLocaleDateString('pt-BR');
}

  loadSessions() {
  this.http
    .get<FocusSession[]>('http://127.0.0.1:8000/sessions')
    .subscribe({
      next: (sessions) => {
        console.log('Sessões recebidas:', sessions);

        this.sessions = sessions;

        this.filterTodaySessions();

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar sessões:', error);
      }
    });
}

  formatTime(dateString: string): string {
  const date = new Date(dateString);

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

  formatDuration(seconds: number | null): string {
  if (!seconds) {
    return 'Em andamento';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }

  if (minutes > 0) {
    return `${minutes}min`;
  }

  return `${remainingSeconds} segundos`;
}

  filterTodaySessions() {
  const today = new Date();

  this.todaySessions = this.sessions.filter((session) => {
    const sessionDate = new Date(session.started_at);

    return (
      sessionDate.getFullYear() === today.getFullYear() &&
      sessionDate.getMonth() === today.getMonth() &&
      sessionDate.getDate() === today.getDate()
    );
  });
}

}
