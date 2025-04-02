import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai"

export const model = new ChatOpenAI({
  temperature: 0.7,
  modelName: "gpt-4o",
  maxTokens: 1000,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
})

// 初始化 OpenAIEmbeddings, 等待与 OpenAI Text Embeddings 的连接
// await embeddings.embedQuery(splitDoc) 向量查询
export const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-ada-002",
  timeout: 1,
  maxConcurrency: 10, //设置最大的并发数 , 意味着同负一时间最多可以并行处理10个请求 ， 避免过多并发请求 ， 导致系统过载和api限流
  maxRetries: 3, //设置最大的重试次数 ， 当api调用失败的时候 ， 程序会自动重试最多三次 ， 这增加请求成功的概率 ， 提高了系统的可靠性
  batchSize: 100, //设置批量处理的大小 ， 每次调用api 最多处理100个文本片段 ， 但同时也要注意api的限制和内存的使用
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
})
