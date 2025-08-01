import { supabase } from '@/lib/supabase';

export const demoDataService = {
  // Create demo user profile
  async createDemoProfile(userId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: 'demo@company.com',
          name: 'John Doe',
          phone: '+62 812-3456-7890',
          position: 'Senior Software Engineer',
          department: 'Engineering',
          employee_id: 'EMP001',
          join_date: '2022-01-15',
          location: 'Jakarta Office',
          work_schedule: '09:00-18:00',
          avatar_url: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200',
        });

      return { error: error?.message || null };
    } catch (error) {
      return { error: 'Failed to create demo profile' };
    }
  },

  // Create demo employees
  async createDemoEmployees() {
    try {
      const demoEmployees = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'jane.smith@company.com',
          name: 'Jane Smith',
          phone: '+62 813-4567-8901',
          position: 'Product Manager',
          department: 'Product',
          employee_id: 'EMP002',
          join_date: '2021-08-20',
          location: 'Jakarta Office',
          work_schedule: '09:00-18:00',
          avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          email: 'mike.johnson@company.com',
          name: 'Mike Johnson',
          phone: '+62 814-5678-9012',
          position: 'UI/UX Designer',
          department: 'Design',
          employee_id: 'EMP003',
          join_date: '2023-03-10',
          location: 'Bandung Office',
          work_schedule: '08:00-17:00',
          avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          email: 'sarah.wilson@company.com',
          name: 'Sarah Wilson',
          phone: '+62 815-7890-1234',
          position: 'Marketing Manager',
          department: 'Marketing',
          employee_id: 'EMP004',
          join_date: '2022-11-05',
          location: 'Jakarta Office',
          work_schedule: '09:00-18:00',
          avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
        },
      ];

      const { error } = await supabase
        .from('profiles')
        .upsert(demoEmployees);

      return { error: error?.message || null };
    } catch (error) {
      return { error: 'Failed to create demo employees' };
    }
  },

  // Create demo notifications
  async createDemoNotifications(userId: string) {
    try {
      const demoNotifications = [
        {
          user_id: userId,
          type: 'announcement',
          title: 'Company Outing 2024',
          message: 'Annual company outing to Bandung on March 15-16. Register now!',
          priority: 'high',
          read: false,
        },
        {
          user_id: userId,
          type: 'reminder',
          title: 'Clock In Reminder',
          message: "Don't forget to clock in today. Your shift starts at 09:00 AM.",
          priority: 'medium',
          read: false,
        },
        {
          user_id: userId,
          type: 'approval',
          title: 'Leave Request Approved',
          message: 'Your annual leave request for Feb 15-20 has been approved.',
          priority: 'medium',
          read: true,
        },
        {
          user_id: userId,
          type: 'system',
          title: 'System Maintenance',
          message: 'The system will undergo maintenance tonight from 11 PM to 2 AM.',
          priority: 'low',
          read: true,
        },
      ];

      const { error } = await supabase
        .from('notifications')
        .insert(demoNotifications);

      return { error: error?.message || null };
    } catch (error) {
      return { error: 'Failed to create demo notifications' };
    }
  },

  // Setup complete demo data
  async setupDemoData(userId: string) {
    try {
      await this.createDemoProfile(userId);
      await this.createDemoEmployees();
      await this.createDemoNotifications(userId);
      
      return { error: null };
    } catch (error) {
      return { error: 'Failed to setup demo data' };
    }
  },
};