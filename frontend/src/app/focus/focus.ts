import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Task {
  id: number;
  type: string;
  title: string;
  activity_tag?: string;
}

@Component({
  selector: 'app-focus',
  imports: [JsonPipe, FormsModule, RouterLink],
  templateUrl: './focus.html',
  styleUrl: './focus.css',
})

export class Focus implements OnInit {
  title = 'Focus Tracker';

  tasks: Task[] = [];

  showTaskForm = false;
  taskType = 'faculdade';
  taskTitle = '';
  activityTag = '';

  activeTaskId: number | null = null;

  elapsedSeconds = 0;
  timerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.http
      .get<Task[]>('http://127.0.0.1:8000/tasks')
      .subscribe({
        next: (tasks) => {
          console.log('Tasks recebidas:', tasks);
          this.tasks = tasks;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao carregar tarefas:', error);
        }
      });
  }

  createTask() {
    const newTask = {
      type: this.taskType,
      title: this.taskTitle,
      activity_tag:
        this.taskType === 'faculdade'
          ? this.activityTag
          : null
    };

    this.http
      .post('http://127.0.0.1:8000/tasks', newTask)
      .subscribe({
        next: () => {
          this.loadTasks();

          this.taskTitle = '';
          this.activityTag = '';
          this.showTaskForm = false;

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao criar tarefa:', error);
        }
      });
  }

  finishTask(taskId: number) {
    this.http
      .post(`http://127.0.0.1:8000/tasks/${taskId}/finish`, {})
      .subscribe({
        next: (response) => {
          console.log('Sessão finalizada:', response);

          this.stopTimer();
          this.activeTaskId = null;

          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao finalizar tarefa:', error);
        }
      });
  }

  startTimer() {
    this.elapsedSeconds = 0;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;

      console.log('Tempo:', this.elapsedSeconds);

      this.cdr.detectChanges();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  startTask(taskId: number) {
    this.http
      .post(`http://127.0.0.1:8000/tasks/${taskId}/start`, {})
      .subscribe({
        next: () => {
          console.log('Tarefa iniciada');

          this.activeTaskId = taskId;

          this.startTimer();

          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao iniciar tarefa:', error);
        }
      });
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);

    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    const remainingSeconds = seconds % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      remainingSeconds.toString().padStart(2, '0')
    ].join(':');
  }
}
