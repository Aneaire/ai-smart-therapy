import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type JSX } from "react";

import { ChatInterface } from "@/components/chat/ChatInterface";
import { Header } from "@/components/chat/Header";
import { MentalHealthDialog } from "@/components/MentalHealthDialog";
import {
  mentalHealthConcerns,
  type MentalHealthConcern,
  type Message,
} from "@/types/chat";
import { useSpeechSynthesis } from "react-speech-kit";

export const Route = createFileRoute("/")({
  component: App,
});

function App(): JSX.Element {
  const [showDialog, setShowDialog] = useState<boolean>(true);
  const [selectedConcern, setSelectedConcern] =
    useState<MentalHealthConcern | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contextSummary, setContextSummary] = useState<string>("");
  const { speak } = useSpeechSynthesis();

  useEffect(() => {
    setShowDialog(true);
  }, []);

  const handleDialogOpenChange = (open: boolean) => {
    setShowDialog(open);

    if (!open && !selectedConcern) {
      // Auto-select last concern if none selected
      const lastConcern = mentalHealthConcerns[mentalHealthConcerns.length - 1];
      if (lastConcern) {
        handleSelectConcern(lastConcern);
      }
    }
  };

  const handleSelectConcern = (concern: MentalHealthConcern): void => {
    setSelectedConcern(concern);
    setShowDialog(false);

    const welcomeMessage: Message = {
      sender: "ai",
      text: `Hello! I understand you're dealing with ${concern.label.toLowerCase()} today. How can I support you?`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const handleResetDialog = (): void => {
    setShowDialog(true);
    setMessages([]);
    setSelectedConcern(null);
  };

  async function generateAIResponse(
    userMessage: string,
    concern: MentalHealthConcern | null,
    contextSummary: string,
    previousAiMessage: string | null
  ): Promise<string> {
    try {
      const instruction = `You're a therapist specializing in cognitive-behavioral therapy (CBT) and active listening. Your goal is to provide empathetic, non-judgmental, and solution-focused guidance to patients. Use open-ended questions, validation, and encouragement to help them explore their thoughts and emotions. Adapt your responses based on their concerns, and avoid diagnosing or giving medical advice. Maintain a warm and professional tone throughout the conversation.
  If the user mentions ${concern?.label.toLowerCase()}, use your knowledge of the concern to provide relevant support.`;

      const prompt = `
  ${instruction}
  
  Summary of the conversation so far:
  ${contextSummary || "None yet."}
  
  Recent exchange:
  User: ${userMessage}
  ${previousAiMessage ? `AI: ${previousAiMessage}` : ""}
  `;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBiuUSKhjgyZxfbsloGDjhr9R8PJzI8nio",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) {
        console.error("Gemini API error:", response.statusText);
        return "Sorry, I am having trouble responding right now. Please try again later.";
      }

      const data = await response.json();
      // ⏱ Delay voice by 3 seconds after streaming ends
      setTimeout(() => {
        speak({ text: data.candidates[0]?.content?.parts[0]?.text });
      }, 1000);
      return (
        data.candidates[0]?.content?.parts[0]?.text ||
        "I'm here to listen. Can you tell me more?"
      );
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return "Sorry, something went wrong. Please try again later.";
    }
  }

  const handleSendMessage = async (message: string): Promise<void> => {
    if (!message.trim()) return;

    const userMessage: Message = {
      sender: "user",
      text: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const lastAiMessage = [...messages]
      .reverse()
      .find((m) => m.sender === "ai");

    const fullResponse = await generateAIResponse(
      message,
      selectedConcern,
      contextSummary,
      lastAiMessage?.text || null
    );

    const tempId = Date.now(); // Unique ID
    const aiMessage: Message = {
      sender: "ai",
      text: "",
      timestamp: new Date(),
      tempId,
    };

    setMessages((prev) => [...prev, aiMessage]);

    let currentIndex = 0;
    const interval = 15;

    const stream = setInterval(() => {
      currentIndex += 1;

      setMessages((prev) => {
        const updatedMessages = [...prev];
        const aiIndex = updatedMessages.findIndex(
          (msg) => msg.tempId === tempId
        );

        if (aiIndex !== -1) {
          updatedMessages[aiIndex] = {
            ...updatedMessages[aiIndex],
            text: fullResponse.slice(0, currentIndex),
          };
        }

        return updatedMessages;
      });

      if (currentIndex >= fullResponse.length) {
        clearInterval(stream);
        setIsLoading(false);
        setContextSummary(
          (prev) =>
            `${prev ? prev + "\n" : ""}User: ${message}\nAI: ${fullResponse}`
        );
      }
    }, interval);
  };

  return (
    <div className="flex flex-col md:h-[80vh] h-[90vh] md:mt-14 mt-10 max-w-5xl mx-auto bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg overflow-hidden">
      <Header
        selectedConcern={selectedConcern}
        onResetDialog={handleResetDialog}
      />

      <main className="flex-1 overflow-hidden flex flex-col p-3">
        <MentalHealthDialog
          open={showDialog}
          onOpenChange={handleDialogOpenChange}
          onSelectConcern={handleSelectConcern}
        />

        {!showDialog && (
          <ChatInterface
            messages={messages}
            selectedConcern={selectedConcern}
            onSendMessage={handleSendMessage}
            // isLoading={isLoading} // optionally pass loading state
          />
        )}
      </main>
    </div>
  );
}

export default App;
