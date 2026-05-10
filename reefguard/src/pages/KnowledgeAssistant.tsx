import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Brain, Sparkles, Loader2, User, Bot,
  BookOpen, RefreshCw, ChevronLeft
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { FloatingBubbles } from '../components/effects/FloatingBubbles';
import { FadeInUp } from '../components/animations/TextReveal';
import { useChat } from '../hooks/useMockApi';
import type { ChatMessage } from '../types';

interface KnowledgeAssistantProps {
  onBack: () => void;
}

const suggestedQuestions = [
  'What causes coral bleaching?',
  'How can we restore damaged reefs?',
  'What are the signs of healthy coral?',
  'Best practices for coral propagation?',
  'Climate change effects on reefs?',
];

export function KnowledgeAssistant({ onBack }: KnowledgeAssistantProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, clearChat } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <div className="flex h-screen bg-ocean-950 overflow-hidden">
      <FloatingBubbles count={6} className="opacity-20" />

      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        {/* Header */}
        <FadeInUp className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={onBack}>
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2">
                <Brain className="w-6 h-6 text-cyan-400" />
                Reef<span className="text-cyan-400">Sentinel</span> Knowledge Assistant
              </h1>
              <p className="text-slate-400 text-sm">
                AI-powered expert for reef ecology and restoration guidance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info" icon={Sparkles} pulse>
              RAG Enabled
            </Badge>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={clearChat}>
              New Chat
            </Button>
          </div>
        </FadeInUp>

        {/* Chat Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {messages.length === 1 && (
                <FadeInUp className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-reef-cyan/20 to-reef-cyan/5 flex items-center justify-center mx-auto mb-6">
                      <Brain className="w-10 h-10 text-reef-cyan" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                      Ask me anything about coral reefs
                    </h2>
                    <p className="text-slate-400 text-sm mb-8">
                      I can help you understand reef health, restoration techniques, 
                      and provide research-backed ecological insights.
                    </p>

                    {/* Suggested Questions */}
                    <div className="grid grid-cols-1 gap-2">
                      {suggestedQuestions.map((question, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleSuggestedQuestion(question)}
                          className="text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white text-sm transition-all border border-slate-700/30 hover:border-reef-cyan/30"
                        >
                          {question}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </FadeInUp>
              )}

              <AnimatePresence>
                {messages.slice(1).map((message, index) => (
                  <MessageBubble key={message.id} message={message} index={index} />
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 text-slate-500"
                >
                  <Loader2 className="w-5 h-5 animate-spin text-reef-cyan" />
                  <span className="text-sm">Researching and formulating response...</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-slate-800/50">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about reef health, restoration, or ecological insights..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-reef-cyan/50 focus:ring-1 focus:ring-reef-cyan/30 transition-all"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    disabled={!input.trim() || isLoading}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </form>
              <p className="text-xs text-slate-500 text-center mt-3">
                Responses are generated using research-backed knowledge. Always verify critical decisions with domain experts.
              </p>
            </div>
          </div>

          {/* Right Panel - Interactive Coral Gallery */}
          <div className="w-80 border-l border-slate-800/50 p-6 hidden lg:block overflow-y-auto">
            <FadeInUp delay={0.2}>
              <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-reef-cyan animate-pulse" />
                Coral Reef Gallery
              </h3>
              
              <div className="space-y-4">
                {/* Coral Image 1 - Hard Coral */}
                <motion.div 
                  className="relative rounded-xl overflow-hidden group cursor-pointer bg-slate-800"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <img
                    src="/background.avif"
                    alt="Hard Coral"
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-3">
                    <p className="text-xs text-white font-medium">Staghorn Coral</p>
                    <p className="text-xs text-slate-300">Hard Coral Species</p>
                  </div>
                </motion.div>

                {/* Coral Image 2 - Soft Coral */}
                <motion.div 
                  className="relative rounded-xl overflow-hidden group cursor-pointer bg-slate-800"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <img
                    src="/coral3.jpg"
                    alt="Soft Coral"
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-3">
                    <p className="text-xs text-white font-medium">Soft Coral Garden</p>
                    <p className="text-xs text-slate-300">Flexible Coral Species</p>
                  </div>
                </motion.div>

                {/* Coral Image 3 - Reef Ecosystem */}
                <motion.div 
                  className="relative rounded-xl overflow-hidden group cursor-pointer bg-slate-800"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <img
                    src="/coral4.jpg"
                    alt="Coral Reef Ecosystem"
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-3">
                    <p className="text-xs text-white font-medium">Vibrant Reef</p>
                    <p className="text-xs text-slate-300">Marine Ecosystem</p>
                  </div>
                </motion.div>

                {/* Fun Fact Card */}
                <motion.div 
                  className="p-4 rounded-xl bg-gradient-to-br from-reef-cyan/10 to-reef-coral/10 border border-reef-cyan/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-xs text-reef-cyan font-medium mb-1">Did You Know?</p>
                  <p className="text-sm text-slate-300">
                    Coral reefs support 25% of all marine species despite covering less than 1% of the ocean floor.
                  </p>
                </motion.div>
              </div>
            </FadeInUp>
          </div>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ message, index }: { message: ChatMessage; index: number }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-slate-700' 
          : 'bg-gradient-to-br from-reef-cyan/20 to-reef-cyan/5 border border-reef-cyan/20'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-slate-400" />
        ) : (
          <Bot className="w-5 h-5 text-reef-cyan" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block max-w-full text-left ${
          isUser 
            ? 'bg-slate-700/50 text-white' 
            : 'glass-card text-slate-300'
        } rounded-2xl px-5 py-3`}>
          <p className="leading-relaxed">{message.content}</p>
        </div>

        <span className="text-xs text-slate-500 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}
