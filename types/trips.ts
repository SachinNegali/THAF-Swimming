export interface Journey {
  id: string;
  title: string;
  isFeatured?: boolean;
  createdDate: string;
  from: string;
  to: string;
  startDate: string;
  endDate: string;
  duration: string;
  description?: string;
}