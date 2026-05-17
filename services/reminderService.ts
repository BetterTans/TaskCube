import { Task } from '../types';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function checkReminders(tasks: Task[]): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  for (const task of tasks) {
    if (task.completed || task.reminderOffset === undefined) continue;
    if (!task.date || !task.startTime) continue;

    const [h, m] = task.startTime.split(':').map(Number);
    const taskTime = new Date(task.date);
    taskTime.setHours(h, m, 0, 0);

    const reminderTime = new Date(taskTime.getTime() + task.reminderOffset * 60000);
    const diff = reminderTime.getTime() - now.getTime();

    // Fire if within the last 60 seconds (to avoid duplicates)
    if (diff <= 0 && diff > -60000) {
      const when = task.reminderOffset < 0
        ? `提前 ${Math.abs(task.reminderOffset)} 分钟`
        : task.reminderOffset === 0 ? '现在' : `延后 ${task.reminderOffset} 分钟`;

      new Notification('NextDo 提醒', {
        body: `${task.title}\n${task.date} ${task.startTime} · ${when}`,
        icon: '/favicon.svg',
        tag: `reminder-${task.id}`,
        requireInteraction: true,
      });
    }
  }
}

// Track fired reminders to avoid duplicates within the minute window
const firedReminders = new Set<string>();

export function checkRemindersOnce(tasks: Task[]): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  for (const task of tasks) {
    if (task.completed || task.reminderOffset === undefined) continue;
    if (!task.date || !task.startTime) continue;
    if (firedReminders.has(task.id)) continue;

    const [h, m] = task.startTime.split(':').map(Number);
    const taskTime = new Date(task.date);
    taskTime.setHours(h, m, 0, 0);

    const reminderTime = new Date(taskTime.getTime() + task.reminderOffset * 60000);
    if (reminderTime <= now) {
      firedReminders.add(task.id);
      const when = task.reminderOffset < 0
        ? `提前 ${Math.abs(task.reminderOffset)} 分钟`
        : task.reminderOffset === 0 ? '现在' : `延后 ${task.reminderOffset} 分钟`;

      new Notification('NextDo 提醒', {
        body: `${task.title}\n${task.date} ${task.startTime} · ${when}`,
        icon: '/favicon.svg',
        tag: `reminder-${task.id}`,
      });
    }
  }
}
