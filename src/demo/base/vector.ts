import { OpenAIEmbeddings } from "@langchain/openai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { FaissStore } from "@langchain/community/vectorstores/faiss"
import type { Document } from "langchain/document"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { embeddings } from "src/demo/base/openai.js"

// 将 RecursiveCharacterTextSplitter 分割的文档进行向量化
export async function vectorSave(docs: Document[]) {
  const vectorStore = await FaissStore.fromDocuments(docs, embeddings)
  await vectorStore.save("./src/db/vector")
}

export async function vectorLoad(input: string) {
  // 加载向量储存
  const vectorstore = await FaissStore.load("./src/db/vector", embeddings)
  // 从向量数据库中创建一个检索器, 检索两条
  const retriever = vectorstore.asRetriever(2)
  // 使用Runnable API进行进行检索
  return await retriever.invoke(input)
}

export async function memTextsVectorStore() {
  // 创建一个内存向量储存
  const vectorstore = await MemoryVectorStore.fromTexts(
    [
      "建筑物由砖块建成",
      "建筑物由木材建成",
      "建筑物由石头建成",
      "汽车由金属制成",
      "汽车由塑料制成",
      "线粒体是细胞的动力工厂",
      "线粒体由脂质构成",
    ],
    // 为每个文本提供相应的元数据，确保数量一致
    [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }],
    embeddings,
  )

  return vectorstore
}

export async function memDocVectorStore(docs: Document[]) {
  return await MemoryVectorStore.fromDocuments(docs, embeddings)
}
