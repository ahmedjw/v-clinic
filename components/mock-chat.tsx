"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { AuthClientService } from "@/lib/auth-client"
import type { User } from "@/lib/db"

interface Message {
  id: string
  sender: "user" | "other"
  text: string
  timestamp: string
}

interface MockChatProps {
  currentUserRole: "doctor" | "patient"
}

export function MockChat({ currentUserRole }: MockChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await AuthClientService.getCurrentUser()
      setCurrentUser(user)
    }
    fetchCurrentUser()

    // Simulate loading past messages
    setMessages([
      {
        id: "1",
        sender: "other",
        text: "Hello! How can I help you today?",
        timestamp: "10:00 AM",
      },
      {
        id: "2",
        sender: "user",
        text: "Hi! I have a question about my appointment.",
        timestamp: "10:05 AM",
      },
      {
        id: "3",
        sender: "other",
        text: "Certainly, please tell me more.",
        timestamp: "10:10 AM",
      },
    ])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (input.trim() && currentUser) {
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: "user",
        text: input.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prevMessages) => [...prevMessages, newMessage])
      setInput("")

      // Simulate a response from the other user
      setTimeout(() => {
        const botResponse: Message = {
          id: Date.now().toString() + "-bot",
          sender: "other",
          text: `(Auto-reply): Thank you for your message, ${currentUser.name}. I'll get back to you shortly.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
        setMessages((prevMessages) => [...prevMessages, botResponse])
      }, 1500)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  const getAvatar = (sender: "user" | "other") => {
    if (sender === "user" && currentUser) {
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={currentUser.avatar || `/placeholder.svg?height=32&width=32&text=${currentUser.name.charAt(0)}`}
            alt={currentUser.name}
          />
          <AvatarFallback>{currentUser.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )
    } else {
      // Generic avatar for the "other" party (e.g., virtual assistant or another user)
      return (
        <Avatar className="h-8 w-8 bg-blue-500 text-white">
          <AvatarFallback>
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )
    }
  }

  if (!currentUser) {
    return <div className="text-center text-gray-500">Loading chat...</div>
  }

  return (
    <Card className="flex h-[500px] w-full flex-col">
      <CardContent className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full pr-4">
          <div className="flex flex-col space-y-4">
            {messages.length === 0 && <div className="text-center text-gray-500 py-10">Start a conversation!</div>}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex items-start", message.sender === "user" ? "justify-end" : "justify-start")}
              >
                {message.sender === "other" && getAvatar("other")}
                <div
                  className={cn(
                    "mx-2 max-w-[70%] rounded-lg p-3",
                    message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  <p className="text-sm">{message.text}</p>
                  <span className="mt-1 block text-right text-xs opacity-70">{message.timestamp}</span>
                </div>
                {message.sender === "user" && getAvatar("user")}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex items-center space-x-2 border-t p-4">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
          disabled={!currentUser}
        />
        <Button onClick={handleSendMessage} disabled={!input.trim() || !currentUser}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
