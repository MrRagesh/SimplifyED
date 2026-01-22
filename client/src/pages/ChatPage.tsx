import { useEffect, useRef, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useConversation, useDeleteConversation } from "@/hooks/use-chat";
import { useChatStream } from "@/hooks/use-chat-stream";
import { Layout } from "@/components/Layout";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { ArrowLeft, Send, Sparkles, User, GraduationCap, StopCircle, BookOpen, Copy, Edit2, Image as ImageIcon, Check, Loader2, Trash2 } from "lucide-react";
import { QuizModal } from "@/components/QuizModal";
import { format } from "date-fns";
import { useGenerateImage } from "@/hooks/use-image-gen";
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const [, params] = useRoute("/chat/:id");
  const conversationId = parseInt(params?.id || "0");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [messageImages, setMessageImages] = useState<Record<number, string>>({});
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const deleteMutation = useDeleteConversation();

  const { data: conversation, isLoading } = useConversation(conversationId);
  const imageGen = useGenerateImage();

  const { sendMessage, isStreaming, streamedContent, abort } = useChatStream({
    conversationId,
    onComplete: () => {
    }
  });

  const topicFromTitle = conversation?.title?.replace("Explain: ", "") || "";
  const lastAssistantMessage = conversation?.messages
    ?.filter(m => m.role === "assistant")
    .slice(-1)[0]?.content;

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation?.messages, streamedContent, isStreaming]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = async (text: string, msgId: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy message.",
        variant: "destructive",
      });
    }
  };

  const handleVisualize = async (content: string, msgId: number) => {
    try {
      toast({
        title: "Generating Visual...",
        description: "Creating a relevant image for this explanation.",
      });
      const imageUrl = await imageGen.mutateAsync(content);
      setMessageImages(prev => ({ ...prev, [msgId]: imageUrl }));
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: "Could not generate an image at this time.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-16 h-16 bg-muted rounded-full" />
            <div className="h-4 w-48 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!conversation) {
    return (
      <Layout>
        <div className="text-center py-20">Conversation not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4 md:mb-6 border-b border-border pb-4 pt-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-lg md:text-2xl truncate">{conversation.title}</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              Started {format(new Date(conversation.createdAt!), "MMM d, yyyy")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuizModalOpen(true)}
            className="rounded-lg flex items-center gap-2 hidden md:flex shrink-0"
          >
            <BookOpen className="w-4 h-4" />
            Test Your Knowledge
          </Button>
          {/* Mobile Quiz Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuizModalOpen(true)}
            className="rounded-lg md:hidden shrink-0"
          >
            <BookOpen className="w-4 h-4" />
          </Button>

          <div className="bg-primary/10 px-3 py-1 rounded-full text-xs font-bold text-primary flex items-center gap-1 shrink-0 hidden sm:flex">
            <Sparkles className="w-3 h-3" />
            AI Tutor
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
            onClick={() => {
              if (confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
                deleteMutation.mutate(conversationId, {
                  onSuccess: () => {
                    toast({
                      title: "Success",
                      description: "Conversation deleted successfully.",
                    });
                    setLocation("/");
                  },
                  onError: () => {
                    toast({
                      title: "Error",
                      description: "Failed to delete conversation.",
                      variant: "destructive",
                    });
                  }
                });
              }
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-2 md:pr-4 -mr-2 md:-mr-4">
          <div className="space-y-6 md:space-y-8 pb-4">
            {conversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 md:gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`
                  flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm
                  ${msg.role === "user" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}
                `}>
                  {msg.role === "user" ? <User className="w-4 h-4 md:w-5 md:h-5" /> : <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />}
                </div>

                <div className={`
                  flex flex-col max-w-[85%] md:max-w-[80%] group
                  ${msg.role === "user" ? "items-end" : "items-start"}
                `}>
                  <div className={`
                    relative px-4 py-3 md:px-6 md:py-4 rounded-2xl shadow-sm text-sm md:text-lg leading-relaxed
                    ${msg.role === "user"
                      ? "bg-accent text-accent-foreground rounded-tr-sm"
                      : "bg-white dark:bg-card border border-border rounded-tl-sm"}
                  `}>
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <div className="flex flex-col gap-4">
                        <MarkdownRenderer content={msg.content} />
                        {messageImages[msg.id] && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-border shadow-md">
                            <img src={messageImages[msg.id]} alt="AI Generated Visualization" className="w-full h-auto object-cover" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className={`
                      absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity
                      ${msg.role === "user" ? "-left-12 right-auto" : "-right-24 top-0"}
                    `}>
                      {msg.role === "user" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur"
                          onClick={() => setInput(msg.content)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur"
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                          >
                            {copiedId === msg.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur"
                            disabled={imageGen.isPending}
                            onClick={() => handleVisualize(msg.content, msg.id)}
                          >
                            {imageGen.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground mt-2 px-1 opacity-70">
                    {format(new Date(msg.createdAt!), "h:mm a")}
                  </span>
                </div>
              </div>
            ))}

            {/* Streaming Message Bubble */}
            {isStreaming && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="flex flex-col max-w-[85%] md:max-w-[75%] items-start">
                  <div className="px-6 py-4 rounded-2xl rounded-tl-sm bg-white dark:bg-card border border-border shadow-sm w-full">
                    {streamedContent ? (
                      <MarkdownRenderer content={streamedContent} animate={true} />
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="animate-pulse">Thinking...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="mt-6 pt-4 border-t border-border bg-background">
          <div className="relative flex items-end gap-2 p-2 bg-card border-2 border-border/50 rounded-2xl focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up question..."
              className="min-h-[60px] max-h-[180px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base py-3 px-2 placeholder:text-muted-foreground/60"
              rows={1}
            />
            <div className="pb-2 pr-2">
              {isStreaming ? (
                <Button
                  size="icon"
                  variant="destructive"
                  className="rounded-xl h-10 w-10 shrink-0"
                  onClick={abort}
                >
                  <StopCircle className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="rounded-xl h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  onClick={() => handleSubmit()}
                  disabled={!input.trim()}
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-3">
            AI can make mistakes. Double check important information.
          </p>
        </div>
      </div>

      {/* Quiz Modal */}
      <QuizModal
        open={quizModalOpen}
        onOpenChange={setQuizModalOpen}
        onQuizCreated={(quizId) => setLocation(`/quiz/${quizId}`)}
        topic={topicFromTitle}
        context={lastAssistantMessage}
      />
    </Layout>
  );
}
