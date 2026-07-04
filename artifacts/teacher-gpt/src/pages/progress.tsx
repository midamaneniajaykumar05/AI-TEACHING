import { AppShell } from "@/components/layout/app-shell";
import { useGetProgress, useListTopicProgress, useListQuizResults } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function Progress() {
  const { data: progress, isLoading: progressLoading } = useGetProgress();
  const { data: topics, isLoading: topicsLoading } = useListTopicProgress();
  const { data: quizzes, isLoading: quizzesLoading } = useListQuizResults();

  // Transform topic data for radar chart (group by main areas or just top 8 topics)
  const radarData = topics?.slice(0, 8).map(t => ({
    subject: t.topic.length > 12 ? t.topic.substring(0, 12) + "..." : t.topic,
    mastery: t.mastery,
    fullMark: 100,
  })) || [];

  // Transform quiz data for bar chart
  const quizData = quizzes?.slice(0, 10).map((q, i) => ({
    name: `Quiz ${i+1}`,
    topic: q.topic,
    score: Math.round((q.score / q.totalQuestions) * 100),
  })).reverse() || [];

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Your Mastery Journey</h1>
            <p className="text-muted-foreground text-lg">
              Visualize your progress across the Python Full Stack curriculum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Radar Chart */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 col-span-1">
              <CardHeader>
                <CardTitle>Skill Coverage</CardTitle>
                <CardDescription>Your mastery levels across active topics</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] w-full">
                {topicsLoading ? (
                  <Skeleton className="w-full h-full rounded-full" />
                ) : radarData.length >= 3 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Mastery"
                        dataKey="mastery"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm flex-col gap-2 text-center p-6">
                    <div className="w-16 h-16 border-2 border-dashed border-border rounded-full flex items-center justify-center mb-2" />
                    Need at least 3 active topics to generate radar chart. Start learning more topics!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Quizzes Chart */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 col-span-1">
              <CardHeader>
                <CardTitle>Recent Quizzes</CardTitle>
                <CardDescription>Scores from your latest assessments</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] w-full">
                {quizzesLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : quizData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quizData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                        formatter={(value: number) => [`${value}%`, 'Score']}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Bar dataKey="score" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center p-6">
                    No quizzes taken yet. As you chat, TeacherGPT will occasionally quiz you to test your knowledge!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Topic List */}
            <Card className="col-span-1 md:col-span-2 bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>Detailed Topic Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {topicsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                  ) : topics?.length ? (
                    topics.sort((a, b) => b.mastery - a.mastery).map((topic, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={topic.id} 
                        className="flex flex-col md:flex-row md:items-center gap-4 border-b border-border/30 pb-6 last:border-0 last:pb-0"
                      >
                        <div className="w-full md:w-1/3 space-y-1">
                          <h4 className="font-medium text-[1.05rem]">{topic.topic}</h4>
                          <div className="flex gap-2">
                            <Badge variant={topic.status === 'mastered' ? 'default' : topic.status === 'in_progress' ? 'secondary' : 'outline'} className="text-[0.65rem]">
                              {topic.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Mastery Level</span>
                            <span className="font-mono font-medium">{topic.mastery}%</span>
                          </div>
                          <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                topic.mastery >= 80 ? 'bg-primary' : 
                                topic.mastery >= 40 ? 'bg-chart-2' : 
                                'bg-chart-3'
                              }`} 
                              style={{ width: `${topic.mastery}%` }} 
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-6 w-full md:w-auto mt-2 md:mt-0 md:pl-6 text-sm text-muted-foreground">
                          <div className="flex flex-col items-center">
                            <span className="font-mono text-foreground font-medium">{topic.lessonsCompleted}</span>
                            <span className="text-[0.7rem] uppercase tracking-wider">Lessons</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="font-mono text-foreground font-medium">{topic.quizzesTaken}</span>
                            <span className="text-[0.7rem] uppercase tracking-wider">Quizzes</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      No progress recorded yet. Start learning to populate this list.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
