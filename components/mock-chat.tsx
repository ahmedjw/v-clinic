"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, X } from "lucide-react"

interface MockChatProps {
  onClose: () => void
}

export function MockChat({ onClose }: MockChatProps) {
  const [messages, setMessages] = useState<string[]>([])
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages((prev) => [...prev, newMessage.trim()])
      setNewMessage("")
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[70vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold">Mock Chat</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <DialogDescription className="mb-4">
          This is a mock chat for demonstration purposes. Messages are not saved.
        </DialogDescription>

        <div className="flex-1 overflow-y-auto p-4 border rounded-md bg-gray-50 mb-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 text-sm mt-4">Start a conversation!</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="flex justify-end">
                <div className="bg-blue-500 text-white p-2 rounded-lg max-w-[80%] break-words">{msg}</div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button onClick={handleSendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
