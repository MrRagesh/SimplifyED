import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  animate?: boolean;
}

function TypingEffect({ text }: { text: string }) {
  const words = text.split(" ");

  return (
    <motion.div className="inline">
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            delay: i * 0.03,
            ease: "easeOut"
          }}
          className="inline-block mr-1"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}

export function MarkdownRenderer({ content, className = "", animate = false }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm md:prose-base max-w-none ${className}`}>
      {animate ? (
        <TypingEffect text={content} />
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      )}
    </div>
  );
}
