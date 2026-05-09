import { 
  Building2, 
  BarChart3, 
  FileText, 
  Database, 
  GraduationCap, 
  LayoutGrid, 
  PenTool, 
  Radio, 
  Settings, 
  Telescope, 
  Users2, 
  Users,
  Monitor,
  CalendarDays,
  Target
} from 'lucide-react';
import React from 'react';

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  to: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { icon: <LayoutGrid size={18} strokeWidth={2.5} />, label: 'Dashboard', to: '/app' },
  { icon: <Telescope size={18} strokeWidth={2.5} />, label: 'Discover', to: '/app/discover' },
  { icon: <GraduationCap size={18} strokeWidth={2.5} />, label: 'My Courses', to: '/app/courses' },
  { icon: <Building2 size={18} strokeWidth={2.5} />, label: 'Placements', to: '/app/placements' },
  { icon: <BarChart3 size={18} strokeWidth={2.5} />, label: 'Leaderboards', to: '/app/leaderboards' },
  { icon: <FileText size={18} strokeWidth={2.5} />, label: 'Exams & Quizzes', to: '/app/exams' },
  { icon: <Users2 size={18} strokeWidth={2.5} />, label: 'Community', to: '/app/community' },
  { icon: <Users size={18} strokeWidth={2.5} />, label: 'Peer Groups', to: '/app/peer-groups' },
  { icon: <CalendarDays size={18} strokeWidth={2.5} />, label: 'Interview Prep', to: '/app/placements/prep' },
  { icon: <Radio size={18} strokeWidth={2.5} />, label: 'Live GD Sessions', to: '/app/live-gd' },
  { icon: <Target size={18} strokeWidth={2.5} />, label: 'Hall of Fame', to: '/app/showcase' },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { icon: <PenTool size={18} strokeWidth={2.5} />, label: 'Courses', to: '/app/admin/courses' },
  { icon: <Target size={18} strokeWidth={2.5} />, label: 'Quiz Builder', to: '/app/admin/quizzes/builder' },
  { icon: <FileText size={18} strokeWidth={2.5} />, label: 'Exams', to: '/app/admin/exams' },
  { icon: <Monitor size={18} strokeWidth={2.5} />, label: 'Exam Operations', to: '/app/admin/exams/ops' },
  { icon: <Building2 size={18} strokeWidth={2.5} />, label: 'Placements Manager', to: '/app/admin/placements' },
  { icon: <Users2 size={18} strokeWidth={2.5} />, label: 'Batch Management', to: '/app/admin/batches' },
  { icon: <Users size={18} strokeWidth={2.5} />, label: 'User Directory', to: '/app/admin/users' },
];

export const FOOTER_NAV_ITEMS: NavItem[] = [
  { icon: <Settings size={18} strokeWidth={2.5} />, label: 'Settings', to: '/app/profile' },
];
