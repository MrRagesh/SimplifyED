import { useConversations, useDeleteConversation } from "@/hooks/use-chat";
import { Layout } from "@/components/Layout";
import { CreateSessionModal } from "@/components/CreateSessionModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Trash2, ArrowRight, Clock } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: conversations, isLoading } = useConversations();
  const deleteMutation = useDeleteConversation();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground">My Learning</h1>
            <p className="text-muted-foreground mt-2 text-lg">Pick up where you left off or start a new topic.</p>
          </div>
          <CreateSessionModal />
        </div>

        {conversations && conversations.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {conversations.map((conv) => (
              <Card 
                key={conv.id} 
                className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm("Delete this session?")) deleteMutation.mutate(conv.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <Link href={`/chat/${conv.id}`}>
                  <div className="p-6 h-full flex flex-col cursor-pointer">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    
                    <h3 className="font-display font-bold text-xl mb-2 line-clamp-1 text-foreground group-hover:text-primary transition-colors">
                      {conv.title}
                    </h3>
                    
                    <div className="mt-auto pt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {conv.createdAt ? formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true }) : 'Just now'}
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border/60">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No learning sessions yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Ready to learn something new? Start your first explanation session now.
            </p>
            <CreateSessionModal />
          </div>
        )}
      </div>
    </Layout>
  );
}
