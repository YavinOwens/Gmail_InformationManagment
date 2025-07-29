'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Bot, 
  RefreshCw, 
  ChevronLeft,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Email {
  id: string;
  subject: string;
  sender: string;
  date: string;
  snippet: string;
  body?: string;
  labels: string[];
  theme?: string;
  category?: string;
}

interface CategorizedEmail extends Email {
  theme: string;
  category: string;
  priority?: 'high' | 'medium' | 'low';
}

interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal' },
  { value: 'informal', label: 'Informal' },
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' }
];

const THEME_COLORS = {
  'work': 'bg-blue-100 text-blue-800',
  'personal': 'bg-green-100 text-green-800',
  'finance': 'bg-yellow-100 text-yellow-800',
  'shopping': 'bg-purple-100 text-purple-800',
  'travel': 'bg-orange-100 text-orange-800',
  'health': 'bg-red-100 text-red-800',
  'education': 'bg-indigo-100 text-indigo-800',
  'other': 'bg-gray-100 text-gray-800'
};

export default function OrganizePage() {
  const router = useRouter();
  const [emails, setEmails] = useState<CategorizedEmail[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<CategorizedEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Assistant state
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<CategorizedEmail | null>(null);
  const [draftResponse, setDraftResponse] = useState('');

  // Load emails on component mount
  useEffect(() => {
    loadEmails();
  }, []);

  // Filter emails when search or theme changes
  useEffect(() => {
    filterEmails();
  }, [emails, searchTerm, selectedTheme]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/emails');
      if (response.ok) {
        const data = await response.json();
        const emailsWithCategories = data.emails.map((email: Email) => ({
          ...email,
          theme: 'uncategorized',
          category: 'general'
        }));
        setEmails(emailsWithCategories);
      }
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEmails = () => {
    let filtered = emails;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(email =>
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.snippet.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by theme
    if (selectedTheme !== 'all') {
      filtered = filtered.filter(email => email.theme === selectedTheme);
    }

    setFilteredEmails(filtered);
    setCurrentPage(1);
  };

  const categorizeEmails = async () => {
    setCategorizing(true);
    try {
      const response = await fetch('/api/organize/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: emails.slice(0, 50) }) // Limit to first 50 emails
      });

      if (response.ok) {
        const categorizedEmails = await response.json();
        setEmails(categorizedEmails);
      }
    } catch (error) {
      console.error('Error categorizing emails:', error);
    } finally {
      setCategorizing(false);
    }
  };

  const askAssistant = async () => {
    if (!userQuestion.trim() || !selectedEmail) return;

    setAssistantLoading(true);
    const newMessage: AssistantMessage = {
      role: 'user',
      content: userQuestion,
      timestamp: new Date()
    };

    setAssistantMessages(prev => [...prev, newMessage]);
    setUserQuestion('');

    try {
      const response = await fetch('/api/organize/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userQuestion,
          email: selectedEmail,
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
        setDraftResponse(data.draftResponse || '');
      }
    } catch (error) {
      console.error('Error asking assistant:', error);
    } finally {
      setAssistantLoading(false);
    }
  };

  const generateDraftResponse = async () => {
    if (!selectedEmail) return;

    setAssistantLoading(true);
    try {
      const response = await fetch('/api/organize/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: selectedEmail,
          tone: selectedTone,
          instructions: userQuestion
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDraftResponse(data.draftResponse);
      }
    } catch (error) {
      console.error('Error generating draft:', error);
    } finally {
      setAssistantLoading(false);
    }
  };

  const getThemeColor = (theme: string) => {
    return THEME_COLORS[theme as keyof typeof THEME_COLORS] || THEME_COLORS.other;
  };

  const paginatedEmails = filteredEmails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h1 className="text-xl font-semibold text-gray-900">Organize</h1>
              </div>
            </div>
            <Button
              onClick={categorizeEmails}
              disabled={categorizing || emails.length === 0}
              className="flex items-center space-x-2"
            >
              {categorizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
              <span>{categorizing ? 'Categorizing...' : 'AI Categorize'}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Email List Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Email Analysis</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadEmails}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search emails..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Themes</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Email Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Theme</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Sender</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            <p className="mt-2 text-gray-500">Loading emails...</p>
                          </TableCell>
                        </TableRow>
                      ) : paginatedEmails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <p className="text-gray-500">No emails found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedEmails.map((email) => (
                          <TableRow key={email.id}>
                            <TableCell>
                              <Badge className={getThemeColor(email.theme)}>
                                {email.theme}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate" title={email.subject}>
                                {email.subject}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate" title={email.sender}>
                                {email.sender}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(email.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedEmail(email)}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, filteredEmails.length)} of{' '}
                      {filteredEmails.length} emails
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Assistant Section */}
          <div className="space-y-6">
            {/* Email Assistant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>Email Assistant</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedEmail && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Selected Email:</p>
                    <p className="text-sm text-blue-700 truncate">{selectedEmail.subject}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <Select value={selectedTone} onValueChange={setSelectedTone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Ask about the email or provide instructions..."
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    rows={3}
                  />

                  <div className="flex space-x-2">
                    <Button
                      onClick={askAssistant}
                      disabled={!userQuestion.trim() || !selectedEmail || assistantLoading}
                      className="flex-1"
                    >
                      {assistantLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                      Ask Assistant
                    </Button>
                    <Button
                      variant="outline"
                      onClick={generateDraftResponse}
                      disabled={!selectedEmail || assistantLoading}
                    >
                      Generate Draft
                    </Button>
                  </div>
                </div>

                {/* Conversation History */}
                {assistantMessages.length > 0 && (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    <p className="text-sm font-medium text-gray-700">Conversation:</p>
                    {assistantMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Draft Response */}
                {draftResponse && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Draft Response:</p>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <Textarea
                        value={draftResponse}
                        onChange={(e) => setDraftResponse(e.target.value)}
                        rows={6}
                        className="border-0 bg-transparent resize-none"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Copy
                      </Button>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Email Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Emails:</span>
                    <span className="font-medium">{emails.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Categorized:</span>
                    <span className="font-medium">
                      {emails.filter(e => e.theme !== 'uncategorized').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Themes Found:</span>
                    <span className="font-medium">
                      {new Set(emails.map(e => e.theme)).size - 1}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 