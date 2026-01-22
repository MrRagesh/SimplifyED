import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTypewriter } from "@/hooks/use-typewriter";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  animate?: boolean;
}

export function MarkdownRenderer({ content, className = "", animate = false }: MarkdownRendererProps) {
  const { displayText } = useTypewriter(content, 20, animate);

  return (
    <div className={`prose prose-sm md:prose-base max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {animate ? displayText : content}
      </ReactMarkdown>
    </div>
  );
}
