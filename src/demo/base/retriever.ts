import { BaseRetriever, type BaseRetrieverInput } from "@langchain/core/retrievers"
import type { VectorStore } from "@langchain/core/vectorstores"
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression"
import { LLMChainExtractor } from "langchain/retrievers/document_compressors/chain_extract"
import { MultiQueryRetriever } from "langchain/retrievers/multi_query"
import { model } from "src/demo/base/openai.js"
import { EnsembleRetriever } from "langchain/retrievers/ensemble"
import { Document } from "langchain/document"

// 多重提问检索器：https://juejin.cn/post/7463005156943757349#heading-2
export async function getMultiQueryRetriever(vector: VectorStore, query: string) {
  const retriever = MultiQueryRetriever.fromLLM({
    // 用于改写的 LLM 模型，不限于 OpenAI 模型
    llm: model,
    // vector store 的 retriever，设置为每次检索三条数据 ,asRetriever()
    retriever: vector.asRetriever(),
    // 对每条输入用 LLM 改写生成四条同义不同表述的 query，默认值为 3
    queryCount: 4,
    //verbose: true,
  })

  return await retriever.invoke(query)
}

// 上下文压缩检索器：https://juejin.cn/post/7463005156943757349#heading-3
export async function getContextualCompressionRetriever(vector: VectorStore, query: string) {
  const baseCompressor = LLMChainExtractor.fromLLM(model)

  const retriever = new ContextualCompressionRetriever({
    baseCompressor,
    baseRetriever: vector.asRetriever(2),
  })

  return await retriever.invoke(query)
}

// 自定义一个简单的检索器类，继承自 BaseRetriever
export class SimpleCustomRetriever extends BaseRetriever {
  // 命名空间，可用于标识和组织检索器
  lc_namespace = []
  // 用于存储待检索的文档数组
  documents

  // 构造函数，接收包含文档数组和基础检索器输入的对象
  constructor(fields: { documents: Document[] } & BaseRetrieverInput) {
    // 调用父类的构造函数
    super(fields)
    // 将传入的文档数组赋值给类的 documents 属性
    this.documents = fields.documents
  }

  // 异步方法，用于获取与查询相关的文档
  async _getRelevantDocuments(query: string) {
    // 过滤文档数组，返回页面内容包含查询关键词的文档
    return this.documents.filter((document) => document.pageContent.includes(query))
  }
}

// 集成检索器: https://juejin.cn/post/7463005156943757349#heading-4
export async function getRetriever(vector: VectorStore, docs: Document[], query: string) {
  // 使用第一组文档创建一个简单的关键词检索器
  const keywordRetriever = new SimpleCustomRetriever({ documents: docs })
  const vectorstoreRetriever = vector.asRetriever()

  // 创建集成检索器，将向量存储检索器和关键词检索器组合
  const retriever = new EnsembleRetriever({
    // 要组合的检索器数组
    retrievers: [vectorstoreRetriever, keywordRetriever],
    // 每个检索器的权重，这里两个检索器权重相同
    weights: [0.5, 0.5],
  })

  // 异步调用集成检索器进行查询，获取相关文档
  return await retriever.invoke(query)
}
