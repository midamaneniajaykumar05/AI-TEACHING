import { AppShell } from "@/components/layout/app-shell";
import { useListTopicProgress, useCreateConversation } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle2, Circle, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

const CURRICULUM = [
  { group: "Python Core", topics: ["Python Fundamentals", "OOP", "Data Structures & Algorithms"] },
  { group: "Version Control", topics: ["Git & GitHub"] },
  { group: "Databases", topics: ["SQL", "PostgreSQL", "MySQL", "SQLite", "Redis"] },
  { group: "Web Frameworks", topics: ["Flask", "FastAPI", "Django"] },
  { group: "API & Auth", topics: ["REST APIs", "Authentication", "JWT"] },
  { group: "Asynchronous", topics: ["Celery"] },
  { group: "Infrastructure", topics: ["Docker", "Linux", "Testing", "CI/CD", "AWS", "Deployment"] },
  { group: "Architecture", topics: ["System Design", "Microservices", "Design Patterns", "Security", "Performance Optimization"] },
  { group: "AI & Agents", topics: ["AI Integration", "LangChain", "Vector Databases", "RAG", "Prompt Engineering", "MCP", "Agentic AI"] }
];

export default function Topics() {
  const [_, setLocation] = useLocation();
  const { data: topicProgress, isLoading } = useListTopicProgress();
  const createConv = useCreateConversation();

  const handleStartTopic = (topic: string) => {
    createConv.mutate({ data: { title: `Learning: ${topic}`, topic } }, {
      onSuccess: (data) => {
        setLocation(`/chat/${data.id}`);
      }
    });
  };

  const getTopicStatus = (topicName: string) => {
    const progress = topicProgress?.find(t => t.topic === topicName);
    return progress ? progress.status : "not_started";
  };

  const getTopicMastery = (topicName: string) => {
    const progress = topicProgress?.find(t => t.topic === topicName);
    return progress ? progress.mastery : 0;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <AppShell>
      <div className="flex-1 overflow-auto pb-20">
        <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Curriculum</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              The complete path to becoming a Python Full Stack developer. Select any topic to begin a focused Socratic learning session.
            </p>
          </div>

          <motion.div variants={container} initial="hidden" animate="show" className="space-y-12">
            {CURRICULUM.map((group) => (
              <div key={group.group} className="space-y-4">
                <h2 className="text-xl font-bold text-muted-foreground tracking-widest uppercase border-b border-border/50 pb-2">
                  {group.group}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.topics.map((topicName) => {
                    const status = getTopicStatus(topicName);
                    const mastery = getTopicMastery(topicName);
                    
                    return (
                      <motion.div variants={item} key={topicName}>
                        <Card 
                          className={`h-full transition-all duration-300 hover:shadow-md cursor-pointer border-border/40 hover:border-primary/40
                            ${status === 'mastered' ? 'bg-primary/5 border-primary/20' : 'bg-card/50 hover:bg-card'}
                          `}
                          onClick={() => handleStartTopic(topicName)}
                        >
                          <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-semibold text-[1.05rem] leading-tight">{topicName}</h3>
                              <div className="mt-1">
                                {status === 'mastered' && <CheckCircle2 size={20} className="text-primary" />}
                                {status === 'in_progress' && <Clock size={20} className="text-chart-2" />}
                                {status === 'not_started' && <Circle size={20} className="text-muted-foreground/30" />}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-auto">
                              {status !== 'not_started' ? (
                                <Badge variant={status === 'mastered' ? "default" : "secondary"} className="bg-background/80">
                                  {mastery}% Mastery
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground/60 border-muted-foreground/20">Not started</Badge>
                              )}
                              
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                                <Play size={14} className="ml-0.5" />
                              </Button>
                            </div>
                            
                            {/* Visual progress bar at bottom of card */}
                            {status !== 'not_started' && (
                              <div className="absolute bottom-0 left-0 h-1 bg-muted/50 w-full">
                                <div 
                                  className={`h-full ${status === 'mastered' ? 'bg-primary' : 'bg-chart-2'}`} 
                                  style={{ width: `${mastery}%` }}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
