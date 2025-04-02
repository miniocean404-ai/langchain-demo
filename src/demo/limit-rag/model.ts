import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai"

// 语言模型实例
export const model = new ChatOpenAI({
  temperature: 0.9,
  model: "gpt-4o",
})

export const embeddings = new OpenAIEmbeddings()

export const rephraseModel = new ChatOpenAI({
  temperature: 0.1,
  model: "gpt-3.5-turbo",
})
