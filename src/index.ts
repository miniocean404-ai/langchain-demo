import { directoryLoader } from "./loader"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { OpenAIEmbeddings } from "@langchain/openai"
import { FaissStore } from "@langchain/community/vectorstores/faiss"
import dotenv from "@dotenvx/dotenvx"

dotenv.config()

const docs = await directoryLoader()
// const textDoc = docs.filter((doc) => doc.metadata.source.endsWith(".txt") || doc.metadata.source.includes("人间词话"))

// RecursiveCharacterTextSplitter 默认按照["\n\n", "\n", " ", ""] 分割
const splitter = new RecursiveCharacterTextSplitter({
  // 文本分割的块大小
  chunkSize: 64,
  // 块与块之间重复的字段大小
  chunkOverlap: 5,
})

const splitDocs = await splitter.splitDocuments(docs)
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-ada-002",
})

const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings)
await vectorStore.save("src/db/vector")

// const splitDoc = splitDocs[0].pageContent
// const res = await embeddings.embedQuery(splitDoc)
