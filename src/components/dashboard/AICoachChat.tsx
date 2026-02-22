'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Bot, Send, User, Loader2, Paperclip, MessageCircle } from "lucide-react"
import { useRef, useEffect, useState } from "react"

const AICoachChat = () => {
  const [inputValue, setInputValue] = useState('')
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/coach',
    }),
  })

  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || status !== 'ready') return

    await sendMessage({ text: inputValue })
    setInputValue('')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg"
          title="Chat with KOSH Coach"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[380px] h-[500px] p-0 bg-white dark:bg-slate-950 flex flex-col overflow-hidden" 
        align="end"
        side="top"
      >
        <Card className="h-full flex flex-col border-0 shadow-none">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              KOSH Coach
            </CardTitle>
            <CardDescription className="text-xs">
              Your AI financial mentor
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
            <ScrollArea className="flex-1 h-0 w-full" ref={scrollRef}>
              <div className="px-4">
                <div className="flex flex-col gap-4 py-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <p className="text-xs">
                      Hi! I'm your KOSH Coach. Ask me anything about your finances,
                      savings goals, or upload a receipt for analysis.
                    </p>
                  </div>
                )}
                
                {messages.map((message: any) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    
                    <div
                      className={`rounded-lg px-3 py-2 max-w-[75%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.parts?.map((part: any, index: number) => {
                        if (part.type === 'text') {
                          return (
                            <p key={index} className="text-xs whitespace-pre-wrap">
                              {part.text}
                            </p>
                          )
                        }
                        return null
                      })}
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                
                {status === 'streaming' && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="rounded-lg px-3 py-2 bg-muted">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
              </div>
            </ScrollArea>
            
            <form onSubmit={handleSubmit} className="p-3 border-t flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about your finances..."
                  disabled={status !== 'ready'}
                  className="flex-1 text-sm"
                />
                <Button 
                  type="button" 
                  size="icon" 
                  variant="outline"
                  disabled={status !== 'ready'}
                  title="Upload receipt (coming soon)"
                  className="flex-shrink-0"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={status !== 'ready' || !inputValue.trim()}
                  className="flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Ask about tax vault, health score, or spending advice
              </p>
            </form>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

export default AICoachChat
