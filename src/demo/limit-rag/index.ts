// 文章：https://juejin.cn/post/7464107728974397491
import { FaissStore } from "@langchain/community/vectorstores/faiss"
import { RunnablePassthrough, RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { embeddings, model } from "./model.js"
import { getRephraseChain, prompt } from "./prompt.js"
import { contextRetrieverChain } from "./retriever.js"
import type { TemplatePlaceholder } from "./types.js"
import { ChatHistory } from "./memory.js"

const directory = "./db/gushi"

export async function getRagChain() {
  const vector = await FaissStore.load(directory, embeddings)
  const retriever = vector.asRetriever(2)

  const ragChain = RunnableSequence.from([
    // 重述链, 使用 RunnablePassthrough.assign 将重述后的问题添加到输入中。
    RunnablePassthrough.assign({
      standalone_question: await getRephraseChain(),
    }),
    // 上下文检索链, 使用 RunnablePassthrough.assign 将检索到的上下文添加到输入模板中的 {context}。
    RunnablePassthrough.assign({
      context: contextRetrieverChain(retriever),
    }),
    // 根据输入的问题及检索信息生成提示模板。
    (input: TemplatePlaceholder) => prompt(input.standalone_question),
    model,
    new StringOutputParser(),
  ])

  // 支持聊天历史记录的 RAG 链
  return new RunnableWithMessageHistory({
    runnable: ragChain,
    getMessageHistory: (sessionId) => new ChatHistory({ sessionId }),
    // 就是 getRephraseChain 中 MessagesPlaceholder 存储的占位符
    historyMessagesKey: "history",
    // 就是 getRephraseChain 中 {question} 占位符
    inputMessagesKey: "question",
  })
}

async function init(question: string, sessionId: string) {
  const ragChain = await getRagChain()
  const result = await ragChain.stream(
    {
      question,
    },
    { configurable: { sessionId } },
  )

  for await (const chunk of result) {
    console.log(chunk)
  }
}
