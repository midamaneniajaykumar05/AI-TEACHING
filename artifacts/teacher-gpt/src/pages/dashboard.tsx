import { AppShell } from "@/components/layout/app-shell";
import { ApiKeyBanner } from "@/components/api-key-banner";
import { useGetProgress, useListTopicProgress, useCreateConversation } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ArrowRight, BookOpen, BrainCircuit, Code2, Play, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const { data: progress, isLoading: progressLoading } = useGetProgress();
  const { data: topics, isLoading: topicsLoading } = useListTopicProgress();
  const createConv = useCreateConversation();

  const handleStartTopic = (topic: string) => {
    createConv.mutate({ data: { title: `Learning: ${topic}`, topic } }, {
      onSuccess: (data) => {
        setLocation(`/chat/${data.id}`);
      }
    });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  } as const;

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  } as const;

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <ApiKeyBanner />
        
        <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Welcome back.</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Ready for another session? Your AI mentor is standing by to continue your Python Full Stack journey.
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div 
            variants={container} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div variants={item}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mastered Topics</p>
                    {progressLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
                      <h3 className="text-3xl font-bold">{progress?.masteredTopics || 0}<span className="text-muted-foreground text-xl">/{progress?.totalTopics || 0}</span></h3>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center text-chart-2">
                    <BrainCircuit size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Mastery</p>
                    {progressLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
                      <h3 className="text-3xl font-bold">{Math.round(progress?.averageMastery || 0)}%</h3>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center text-chart-3">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Lessons Completed</p>
                    {progressLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
                      <h3 className="text-3xl font-bold">{progress?.totalLessons || 0}</h3>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Quick Start / In Progress Topics */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Code2 className="text-primary" />
                  Continue Learning
                </h2>
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
                  <Link href="/topics">View Curriculum <ArrowRight size={16} className="ml-1" /></Link>
                </Button>
              </div>

              <div className="space-y-4">
                {topicsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))
                ) : topics?.filter(t => t.status === 'in_progress').length ? (
                  topics.filter(t => t.status === 'in_progress').slice(0, 3).map((topic) => (
                    <Card key={topic.id} className="overflow-hidden border-border/40 hover:border-primary/50 transition-colors group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                      <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{topic.topic}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><BookOpen size={14} /> {topic.lessonsCompleted} lessons</span>
                            <span>{topic.mastery}% mastery</span>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleStartTopic(topic.topic)}
                          className="rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0"
                          disabled={createConv.isPending}
                        >
                          Resume <Play size={16} className="ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-dashed border-2 bg-transparent">
                    <CardContent className="p-10 text-center space-y-4 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                        <BrainCircuit size={32} className="text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold">Your curriculum is waiting</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        You don't have any topics in progress yet. Let's start with Python Fundamentals to begin your journey.
                      </p>
                      <Button onClick={() => handleStartTopic("Python Fundamentals")} className="mt-4 shadow-lg shadow-primary/20">
                        Start Python Fundamentals
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Recent Activity</h2>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-0">
                  {progressLoading ? (
                    <div className="p-6 space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex gap-4">
                          <Skeleton className="h-2 w-2 rounded-full mt-2" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : progress?.recentActivity?.length ? (
                    <div className="relative p-6">
                      <div className="absolute left-8 top-8 bottom-8 w-px bg-border" />
                      <div className="space-y-6">
                        {progress.recentActivity.map((activity, i) => (
                          <div key={i} className="relative flex gap-4">
                            <div className={`w-4 h-4 rounded-full mt-1 shrink-0 z-10 ${
                              activity.status === 'mastered' ? 'bg-primary border-4 border-background' : 
                              activity.status === 'in_progress' ? 'bg-chart-2 border-4 border-background' : 'bg-muted border-4 border-background'
                            }`} />
                            <div>
                              <p className="text-sm font-medium">Worked on <span className="text-foreground">{activity.topic}</span></p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {activity.status === 'mastered' ? 'Mastered!' : `Reached ${activity.mastery}% mastery`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No recent activity. Start learning to see your progress here!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
