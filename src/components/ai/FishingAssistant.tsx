import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Fish, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIChat, type ChatMessage } from '@/hooks/useAIChat';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface FishingAssistantProps {
  className?: string;
}

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-2 mb-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Fish className="w-4 h-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        )}
      >
        {isUser ? (
          message.content
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const SuggestedQuestions = ({ onSelect }: { onSelect: (q: string) => void }) => {
  const suggestions = [
    "What's the best bait for bass?",
    "How does weather affect fishing?",
    "Tips for catching trout?",
  ];

  return (
    <div className="space-y-2 p-4">
      <p className="text-xs text-muted-foreground text-center mb-3">
        Try asking about:
      </p>
      {suggestions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="w-full text-left text-sm px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
        >
          {q}
        </button>
      ))}
    </div>
  );
};

export const FishingAssistant = ({ className }: FishingAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat();
  const { subscription, checkFeatureAccess } = useSubscription();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if user has access (Pro or Elite)
  const hasAccess = checkFeatureAccess('ai_predictions') || 
    subscription?.tier === 'pro' || 
    subscription?.tier === 'elite';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleSuggestionSelect = (question: string) => {
    sendMessage(question);
  };

  if (!hasAccess) {
    return null; // Don't show for free users
  }

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
              <div className="flex items-center gap-2">
                <Fish className="w-5 h-5" />
                <span className="font-semibold">Fishing Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={clearMessages}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="h-[350px]" ref={scrollRef}>
              <div className="p-4">
                {messages.length === 0 ? (
                  <>
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <Fish className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Hi! I'm your AI fishing guide. Ask me anything about fishing techniques, baits, or conditions!
                      </p>
                    </div>
                    <SuggestedQuestions onSelect={handleSuggestionSelect} />
                  </>
                ) : (
                  messages.map((msg, idx) => (
                    <MessageBubble key={idx} message={msg} />
                  ))
                )}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2">
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about fishing..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors',
          isOpen 
            ? 'bg-muted text-muted-foreground' 
            : 'bg-primary text-primary-foreground'
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </motion.button>
    </div>
  );
};

export default FishingAssistant;
