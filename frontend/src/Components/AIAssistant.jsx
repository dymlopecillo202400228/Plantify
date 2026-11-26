import {useState,useRef,useEffect} from "react";
import {Bot,Sprout,X,Send,Sparkles,MessageCircle} from "lucide-react";
import api from "../ApiClient/api";
import "../Style/AIAssistant.css";
export default function AIAssistant() {

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Hello! ðŸŒ± Welcome to Plantify. I'm your AI gardening assistant. How can I help you today?"
    }
  ]);

  const bottomRef = useRef(null);

  const requestPending = useRef(false);

  const suggestions = [
    "Best plants for beginners",
    "Plants under â‚±500",
    "Indoor plant recommendations",
    "How to care for succulents?"
  ];

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [messages, loading, isOpen]);

  async function sendMessage(question) {

    const text = question.trim();

    if (!text || requestPending.current) return;

    requestPending.current = true;

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text
      }
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await api.post(
        "/ai/chat",
        {
          message: text
        }
      );

      const reply = response.data?.reply;

      if (typeof reply !== "string" || !reply.trim()) {
        throw new Error("Invalid AI response.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: reply
        }
      ]);

    } catch (error) {

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text:
            error.response?.data?.message ||
            "Sorry, I couldn't answer your question right now. Please try again."
        }
      ]);

    } finally {
      requestPending.current = false;
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="plantify-ai">

      {isOpen && (
        <section
          className="plantify-ai-window"
          aria-label="Plantify AI Assistant"
        >

          <header className="plantify-ai-header">

            <div className="plantify-ai-avatar">
              <Sprout size={25} />
            </div>

            <div className="plantify-ai-heading">
              <h3>Plantify AI Assistant</h3>

              <p>
                Your gardening companion
              </p>
            </div>

            <button
              type="button"
              className="plantify-ai-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI assistant"
            >
              <X size={21} />
            </button>

          </header>

          <div
            className="plantify-ai-messages"
            role="log"
            aria-live="polite"
          >

            <div className="plantify-ai-date">
              <Sparkles size={13} />
              AI Gardening Assistant
            </div>

            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  `plantify-ai-message ${message.role}`
                }
              >

                {message.role === "assistant" && (
                  <div className="plantify-ai-bot">
                    <Bot size={18} />
                  </div>
                )}

                <div className="plantify-ai-bubble">
                  {message.text}
                </div>

              </div>
            ))}

            {loading && (
              <div className="plantify-ai-message assistant">

                <div className="plantify-ai-bot">
                  <Bot size={18} />
                </div>

                <div className="plantify-ai-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

              </div>
            )}

            {messages.length === 1 && (
              <div className="plantify-ai-suggestions">

                <p>Try asking me:</p>

                {suggestions.map((question) => (
                  <button
                    type="button"
                    key={question}
                    onClick={() =>
                      sendMessage(question)
                    }
                    disabled={loading}
                  >
                    {question}
                  </button>
                ))}

              </div>
            )}

            <div ref={bottomRef} />

          </div>

          <form
            className="plantify-ai-form"
            onSubmit={handleSubmit}
          >

            <input
              type="text"
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              placeholder="Ask about plants..."
              aria-label="Your gardening question"
              maxLength={1000}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send size={19} />
            </button>

          </form>

          <div className="plantify-ai-footer">
            <Sparkles size={12} />
            Powered by AI Â· Plantify
          </div>

        </section>
      )}

      <button
        type="button"
        className="plantify-ai-launcher"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={
          isOpen
            ? "Close gardening assistant"
            : "Open gardening assistant"
        }
        aria-expanded={isOpen}
      >

        {isOpen
          ? <X size={27} />
          : <MessageCircle size={27} />
        }

        {!isOpen && (
          <span className="plantify-ai-indicator">
            <Sparkles size={11} />
          </span>
        )}

      </button>

    </div>
  );
}