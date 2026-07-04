import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { AppShell } from "@/components/layout/app-shell";
import { useGetConversation, useGetAiStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, TerminalSquare, User, Bot, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const params = useParams();
  const id = Number(params.id);
  const [_, setLocation] = useLocation();
  
  const { data: aiStatus } = useGetAiStatus();
  const isAiConfigured = aiStatus?.configured;

  const { data: conversation, isLoading, error } = useGetConversation(id, { 
    query: { enabled: !!id, queryKey: [`/api/conversations/${id}`] } 
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync initial messages
  useEffect(() => {
    if (conversation?.messages && messages.length === 0) {
      setMessages(conversation.messages as ChatMessage[]);
    }
  }, [conversation, messages.length]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Focus input on load
  useEffect(() => {
    if (textareaRef.current && !isLoading) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    if (!isAiConfigured) {
      alert("OpenAI API key not configured. Please add OPENAI_API_KEY to Replit Secrets.");
      return;
    }

    const userMessage = input;
    setInput("");
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

    try {
      // Create empty assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!res.ok) throw new Error("Failed to send message");
      
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          
          // Parse SSE lines
          const lines = buffer.split('\n');
          // Keep last incomplete line in buffer
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (!dataStr) continue;
              
              try {
                const data = JSON.parse(dataStr);
                if (data.done) {
                  done = true;
                  break;
                }
                if (data.content) {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    lastMsg.content += data.content;
                    return newMessages;
                  });
                }
              } catch (e) {
                console.error("Failed to parse SSE data", e, dataStr);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      // Remove the failed empty message
      setMessages(prev => {
        const newMsgs = [...prev];
        if (newMsgs[newMsgs.length - 1].content === "") {
          newMsgs.pop();
        }
        return newMsgs;
      });
    } finally {
      setIsStreaming(false);
      // Let React Query refetch in the background to sync IDs and exact state
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (error) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-6">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Failed to load conversation. It may have been deleted.</AlertDescription>
            <Button variant="outline" className="mt-4" onClick={() => setLocation("/")}>Back to Dashboard</Button>
          </Alert>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col h-full bg-background relative">
        {/* Header */}
        <header className="h-14 border-b border-border/50 bg-background/95 backdrop-blur z-10 flex items-center px-6 shrink-0 justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">{conversation?.title || "Session"}</h2>
            {conversation?.topic && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                {conversation.topic}
              </span>
            )}
          </div>
          {isAiConfigured === false && (
            <div className="text-xs text-destructive flex items-center gap-1 font-medium bg-destructive/10 px-2 py-1 rounded">
              <AlertCircle size={14} /> Missing API Key
            </div>
          )}
        </header>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {isLoading ? (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <Skeleton className="h-20 w-3/4 rounded-xl" />
                </div>
                <div className="flex gap-4 flex-row-reverse">
                  <Skeleton className="h-16 w-1/2 rounded-xl" />
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-[50vh] flex flex-col items-center justify-center text-center opacity-70">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                  <Bot size={32} />
                </div>
                <h3 className="text-xl font-medium mb-2">Ready to learn?</h3>
                <p className="text-sm max-w-sm">
                  I'm your AI Python mentor. Ask me a question about {conversation?.topic || "Python"}, or let me guide you through the next concept.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id || `msg-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${
                      msg.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    }`}>
                      {msg.role === "user" ? <User size={16} /> : <TerminalSquare size={16} />}
                    </div>
                    
                    <div className={`group relative max-w-[85%] ${msg.role === "user" ? "bg-secondary/50" : ""} rounded-xl px-5 py-4`}>
                      {msg.content === "" && isStreaming && i === messages.length - 1 ? (
                        <div className="flex space-x-1 h-6 items-center">
                          <motion.div className="w-2 h-2 bg-primary/60 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                          <motion.div className="w-2 h-2 bg-primary/60 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                          <motion.div className="w-2 h-2 bg-primary/60 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                        </div>
                      ) : (
                        <div className="prose prose-invert max-w-none text-[0.95rem] leading-relaxed prose-p:my-2 prose-headings:my-4 prose-ul:my-2 prose-li:my-0.5">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({node, inline, className, children, ...props}: any) {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={vscDarkPlus as any}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ margin: 0, borderRadius: '0.5rem', background: 'hsl(var(--muted)/0.5)' }}
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                )
                              }
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                          
                          {/* Blinking cursor effect for last streaming message */}
                          {isStreaming && i === messages.length - 1 && (
                            <motion.span 
                              animate={{ opacity: [1, 0] }} 
                              transition={{ repeat: Infinity, duration: 0.8 }}
                              className="inline-block w-2 h-4 bg-primary align-middle ml-1"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background/80 backdrop-blur border-t border-border/50 shrink-0">
          <form 
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto relative rounded-xl border border-input bg-card shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all"
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or type your code..."
              className="min-h-[60px] max-h-[200px] w-full resize-none border-0 focus-visible:ring-0 bg-transparent py-4 pl-4 pr-14 text-sm font-sans"
              rows={1}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || isStreaming || !isAiConfigured}
              className={`absolute right-2 bottom-2 h-8 w-8 rounded-lg transition-all ${
                input.trim() && !isStreaming ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Send size={14} className={input.trim() && !isStreaming ? "translate-x-[-1px] translate-y-[1px]" : ""} />
            </Button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[0.65rem] text-muted-foreground font-mono">TeacherGPT uses Socratic methods. It won't write the code for you, but will help you figure it out.</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
