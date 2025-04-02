import { RunnableSequence } from "@langchain/core/runnables"
import type { TemplatePlaceholder } from "./types.js"
import type { Document } from "langchain/document"
import type { BaseRetriever } from "@langchain/core/retrievers"

const convertDocsToString = (documents: Document[]) => {
  return documents.map((document) => document.pageContent).join("\n")
}

// 上下文检索链：根据重述的问题检索数据
export const contextRetrieverChain = (retriever: BaseRetriever) =>
  RunnableSequence.from<TemplatePlaceholder, string>([
    // 提取输入中的 standalone_question
    (input) => input.standalone_question,
    retriever,
    convertDocsToString,
  ])
