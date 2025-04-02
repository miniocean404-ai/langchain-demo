import type { Document } from "langchain/document"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

export async function splitDocument(docs: Document[]) {
  // RecursiveCharacterTextSplitter 默认按照["\n\n", "\n", " ", ""] 分割
  const splitter = new RecursiveCharacterTextSplitter({
    // 文本分割的块大小
    chunkSize: 64,
    // 块与块之间重复的字段大小
    chunkOverlap: 5,
  })

  // 分割文档
  return await splitter.splitDocuments(docs)
}

export async function splitText(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 20,
  })

  return await splitter.createDocuments([text])
}
