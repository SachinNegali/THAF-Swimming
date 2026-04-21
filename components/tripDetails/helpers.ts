import { Alert, Platform, ToastAndroid } from 'react-native';

export interface Question {
  id: string;
  initials: string;
  author: string;
  time: string;
  question: string;
  answer: {
    author: string;
    text: string;
  };
}

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function notify(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(message);
  }
}

export const QUESTIONS: Question[] = [
  {
    id: '1',
    initials: 'JD',
    author: 'John Doe',
    time: '2 days ago',
    question: 'Is this trip suitable for a first-time alpine rider?',
    answer: {
      author: 'Marco',
      text: 'Yes, but you should be comfortable with sharp hairpins. We\'ll take it at a steady pace!',
    },
  },
  {
    id: '2',
    initials: 'AS',
    author: 'Alice Smith',
    time: '5 hours ago',
    question: 'What\'s the backup plan for bad weather?',
    answer: {
      author: 'Marco',
      text: 'We have alternative lower-altitude routes if the passes are closed or unsafe due to snow/rain.',
    },
  },
];
