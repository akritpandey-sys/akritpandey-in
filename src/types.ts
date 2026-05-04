export interface Profile {
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  bannerUrl?: string;
  skills: string[];
  socialLinks: Record<string, string>;
  achievements: string[];
  stats: {
    projectsCompleted: number;
    activeProjects: number;
    companyValuation: number;
    teamSize: number;
  };
}

export interface NewsPost {
  id: string;
  headline: string;
  subheadline: string;
  description: string;
  imageUrls: string[];
  videoUrls?: string[];
  fileUrls: string[];
  featuredImageUrl?: string;
  tags: string[];
  createdAt: any; // Firestore Timestamp
  authorId: string;
}

export interface WikiPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  lastUpdated: any;
  updatedBy: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  client: string;
  value: number;
  status: 'Active' | 'Completed' | 'Pending';
  teamMembers: string[];
  startDate: string;
  endDate: string;
  mediaUrls?: { url: string; type: 'image' | 'video' | 'file'; name: string }[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  assignedProjects: string[];
  performance: string;
}

export interface FinanceRecord {
  id: string;
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface Job {
  id: string;
  title: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description: string;
  requirements: string[];
  salary?: string;
  status: 'Open' | 'Closed';
  createdAt: any;
  image?: string;
  questions?: string[];
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  resumeUrl: string;
  status: 'Pending' | 'Reviewing' | 'Interviewing' | 'Accepted' | 'Rejected';
  createdAt: any;
  answers: Record<string, string>;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  content: string;
  read: boolean;
  createdAt: any;
}

export interface UserProfile extends Profile {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'employee';
  resumeUrl?: string;
  appliedJobs?: string[];
}
