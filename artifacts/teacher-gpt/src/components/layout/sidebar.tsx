import { Link, useLocation } from "wouter";
import { 
  TerminalSquare, 
  MessageSquare, 
  LayoutDashboard, 
  BarChart3, 
  BookOpen, 
  Settings,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useListConversations, useCreateConversation } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { data: conversations, isLoading } = useListConversations();
  const createConv = useCreateConversation();

  const handleNewChat = () => {
    createConv.mutate({ data: { title: "New Conversation" } }, {
      onSuccess: (data) => {
        setLocation(`/chat/${data.id}`);
      }
    });
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: BookOpen, label: "Topics", href: "/topics" },
    { icon: BarChart3, label: "Progress", href: "/progress" },
  ];

  return (
    <div className="w-72 border-r border-border bg-sidebar h-[100dvh] flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/20">
          <TerminalSquare size={18} strokeWidth={2.5} />
        </div>
        <span className="font-sans font-bold text-lg tracking-wide text-sidebar-foreground">TeacherGPT</span>
      </div>
      
      <div className="p-4">
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start gap-2 shadow-sm font-medium" 
          size="sm"
          disabled={createConv.isPending}
        >
          <Plus size={16} />
          New Session
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 mb-8">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`
                flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer
                ${location === item.href || (location.startsWith('/chat') && item.href === '/chat') 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}
              `}>
                <item.icon size={16} className={location === item.href ? "text-primary" : "text-muted-foreground"} />
                {item.label}
              </div>
            </Link>
          ))}
        </div>

        <div className="mb-2 px-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Sessions</span>
        </div>
        
        <div className="space-y-1">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-3 py-2">
                <Skeleton className="h-4 w-full bg-muted/50" />
              </div>
            ))
          ) : conversations?.length === 0 ? (
             <div className="px-3 py-2 text-xs text-muted-foreground/70 italic">
               No recent sessions
             </div>
          ) : (
            conversations?.slice(0, 10).map((conv) => (
              <Link key={conv.id} href={`/chat/${conv.id}`}>
                <div className={`
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer group
                  ${location === `/chat/${conv.id}` 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}
                `}>
                  <MessageSquare size={14} className="flex-shrink-0" />
                  <span className="truncate">{conv.title || "Untitled Session"}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground cursor-pointer transition-colors">
          <Settings size={16} />
          Settings
        </div>
      </div>
    </div>
  );
}
