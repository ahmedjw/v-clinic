"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Bot } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/db"

interface Message {
  id: string
  sender: "user" | "bot"
  text: string
  timestamp: string
}

interface MockChatProps {
  currentUser: User
}

export function MockChat({ currentUser }: MockChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  const handleSendMessage = () => {
    if (input.trim() === "") return

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prevMessages) => [...prevMessages, newMessage])
    setInput("")

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now().toString() + "-bot",
        sender: "bot",
        text: `Hello ${currentUser.name}, I received your message: "${newMessage.text}". How can I assist you further?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prevMessages) => [...prevMessages, botResponse])
    }, 1000)
  }

  const getSenderAvatar = (sender: "user" | "bot") => {
    if (sender === "user") {
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={`/placeholder.svg?height=32&width=32&text=${currentUser.name.charAt(0)}`}
            alt={currentUser.name}
          />
          <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
      )
    } else {
      return (
        <Avatar className="h-8 w-8 bg-blue-500 text-white">
          <AvatarFallback>
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )
    }
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-lg shadow-sm bg-white">
      <div className="p-4 border-b flex items-center gap-3">
        <Bot className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold">Virtual Assistant Chat</h3>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-10">Start a conversation with your virtual assistant!</div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex items-start gap-3", message.sender === "user" ? "justify-end" : "justify-start")}
            >
              {message.sender === "bot" && getSenderAvatar("bot")}
              <div
                className={cn(
                  "max-w-[70%] p-3 rounded-lg",
                  message.sender === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none",
                )}
              >
                <p className="text-sm">{message.text}</p>
                <span className="text-xs opacity-75 mt-1 block text-right">{message.timestamp}</span>
              </div>
              {message.sender === "user" && getSenderAvatar("user")}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t flex items-center gap-2">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSendMessage()
            }
          }}
          className="flex-1"
        />
        <Button onClick={handleSendMessage} disabled={input.trim() === ""}>
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  )
}
