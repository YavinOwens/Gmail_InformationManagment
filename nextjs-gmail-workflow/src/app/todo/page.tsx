'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Send, Users, Calendar, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react';

interface Email {
  id: string;
  subject: string;
  sender: string;
  snippet: string;
  body: string;
  date: string;
}

interface TodoTask {
  id: string;
  emailId: string;
  title: string;
  description: string;
  type: 'response' | 'follow-up' | 'team-workflow' | 'action';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  dueDate?: string;
  aiGenerated: boolean;
  createdAt: string;
}

interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function TodoPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState('professional');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const TONE_OPTIONS = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' }
  ];

  const PRIORITY_COLORS = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800'
  };

  const TYPE_ICONS = {
    response: Send,
    'follow-up': Clock,
    'team-workflow': Users,
    action: AlertCircle
  };

  // Load emails on component mount
  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      const response = await fetch('/api/emails');
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
      }
    } catch (error) {
      console.error('Error loading emails:', error);
    }
  };

  const generateTasksFromEmails = async () => {
    if (selectedEmails.length === 0) {
      alert('Please select at least one email to generate tasks from.');
      return;
    }

    setTaskLoading(true);
    try {
      const selectedEmailData = emails.filter(email => selectedEmails.includes(email.id));
      
      const response = await fetch('/api/todo/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: selectedEmailData,
          tone: selectedTone
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newTasks = data.tasks.map((task: any, index: number) => ({
          ...task,
          id: `task-${Date.now()}-${index}`,
          createdAt: new Date().toISOString(),
          aiGenerated: true
        }));
        
        setTasks(prev => [...prev, ...newTasks]);
        setSelectedEmails([]); // Clear selection after generating tasks
      } else {
        const errorData = await response.json();
        alert(`Error generating tasks: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error generating tasks:', error);
      alert('Failed to generate tasks. Please try again.');
    } finally {
      setTaskLoading(false);
    }
  };

  const askAssistant = async () => {
    if (!userQuestion.trim()) return;

    setAssistantLoading(true);
    const questionText = userQuestion;
    const newMessage: AssistantMessage = {
      role: 'user',
      content: questionText,
      timestamp: new Date()
    };

    setAssistantMessages(prev => [...prev, newMessage]);
    setUserQuestion('');

    try {
      const response = await fetch('/api/todo/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionText,
          selectedEmails: emails.filter(email => selectedEmails.includes(email.id)),
          tasks: tasks,
          tone: selectedTone,
          conversationHistory: assistantMessages
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: AssistantMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setAssistantMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorData = await response.json();
        const errorMessage: AssistantMessage = {
          role: 'assistant',
          content: `Error: ${errorData.error || 'Failed to get response from assistant'}`,
          timestamp: new Date()
        };
        setAssistantMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error asking assistant:', error);
      const errorMessage: AssistantMessage = {
        role: 'assistant',
        content: 'Error: Failed to connect to assistant service',
        timestamp: new Date()
      };
      setAssistantMessages(prev => [...prev, errorMessage]);
    } finally {
      setAssistantLoading(false);
    }
  };

  const toggleEmailSelection = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const filteredTasks = tasks.filter(task => {
    const typeMatch = filterType === 'all' || task.type === filterType;
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    return typeMatch && priorityMatch && statusMatch;
  });

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const urgent = tasks.filter(t => t.priority === 'urgent').length;

    return { total, completed, pending, inProgress, urgent };
  };

  const stats = getTaskStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Task Manager</h1>
            <p className="text-gray-600">AI-powered task generation from your emails</p>
          </div>
          <Button onClick={loadEmails} variant="outline">
            Refresh Emails
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Total Tasks</span>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Urgent</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Select Emails for Task Generation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Select value={selectedTone} onValueChange={setSelectedTone}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={generateTasksFromEmails}
                  disabled={selectedEmails.length === 0 || taskLoading}
                  className="flex items-center space-x-2"
                >
                  {taskLoading ? 'Generating...' : 'Generate Tasks'}
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {emails.map(email => (
                  <div key={email.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={selectedEmails.includes(email.id)}
                      onCheckedChange={() => toggleEmailSelection(email.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm truncate">{email.subject}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {new Date(email.date).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{email.sender}</p>
                      <p className="text-xs text-gray-500 mt-1">{email.snippet}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>AI Task Assistant</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Ask the AI assistant about your tasks, emails, or workflow..."
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex items-center space-x-2">
                  <Select value={selectedTone} onValueChange={setSelectedTone}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={askAssistant}
                    disabled={!userQuestion.trim() || assistantLoading}
                    className="flex-1"
                  >
                    {assistantLoading ? 'Thinking...' : 'Ask Assistant'}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {assistantMessages.map((message, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-100 ml-4' 
                      : 'bg-gray-100 mr-4'
                  }`}>
                    <div className="text-xs text-gray-500 mb-1">
                      {message.role === 'user' ? 'You' : 'Assistant'} - {message.timestamp.toLocaleTimeString()}
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Generated Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex items-center space-x-4 mb-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="response">Response</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="team-workflow">Team Workflow</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Task List */}
            <div className="space-y-3">
              {filteredTasks.map(task => {
                const TypeIcon = TYPE_ICONS[task.type as keyof typeof TYPE_ICONS];
                return (
                  <div key={task.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={() => toggleTaskStatus(task.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TypeIcon className="h-4 w-4 text-gray-500" />
                          <h4 className="font-medium">{task.title}</h4>
                          {task.aiGenerated && (
                            <Badge variant="outline" className="text-xs">
                              AI Generated
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}>
                            {task.priority}
                          </Badge>
                          <Badge className={STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]}>
                            {task.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask(task.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      {task.assignedTo && (
                        <p className="text-xs text-gray-500 mt-1">Assigned to: {task.assignedTo}</p>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-gray-500 mt-1">Due: {task.dueDate}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {filteredTasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No tasks found. Select emails and generate tasks to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 