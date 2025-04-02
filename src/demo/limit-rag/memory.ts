import { BaseListChatMessageHistory } from "@langchain/core/chat_history"
import type { BaseMessage } from "@langchain/core/messages"
import type { ChatHistoryProps } from "./types.js"

// 自己实现一套聊天历史记录，也可以用 ChatMessageHistory 内置的放在内存中使用
export class ChatHistory extends BaseListChatMessageHistory {
  lc_namespace: string[]
  #sessionId: string
  #messages: BaseMessage[] = []

  constructor({ sessionId }: ChatHistoryProps) {
    super()
    this.lc_namespace = ["limit-rag", "json-chat-history"]
    this.#sessionId = sessionId
  }

  async getMessages(): Promise<BaseMessage[]> {
    return this.#messages
  }

  async addMessage(message: BaseMessage): Promise<void> {
    this.#messages.push(message)
  }
}
