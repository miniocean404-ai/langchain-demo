import { StringOutputParser } from "@langchain/core/output_parsers"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { RunnableSequence } from "@langchain/core/runnables"
import { rephraseModel } from "./model.js"

// llm 重塑用户提问
export async function getRephraseChain() {
  const rephraseChainPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "给定以下对话和一个后续问题，请将后续问题重述为一个独立的问题。请注意，重述的问题应该包含足够的信息，使得没有看过对话历史的人也能理解。",
    ],
    // 添加一个 {history} 占位符，用于存储对话历史
    new MessagesPlaceholder("history"),
    ["human", "将以下问题重述为一个独立的问题：\n{question}"],
  ])

  return RunnableSequence.from([rephraseChainPrompt, rephraseModel, new StringOutputParser()])
}

// 根据 getRephraseChain 输出提示模板
export const prompt = (question: string) =>
  ChatPromptTemplate.fromMessages([
    [
      "system",
      `
        以下是知识库中跟用户回答相关的内容：
        {context}

        你是一个把小学所有故事都背完了的小学生，精通根据故事原文详细解释和回答问题，你在回答时会引用知识库中的作品原文。
        并且回答时仅根据原文，尽可能回答用户问题，
        请仔细阅读知识库,时间很充足,你必须做到精准把握知识库中的内容 , 之后根据下面规则
        1.如果用户的问题${question}与{context}有关,但是知识库中没有相关的内容，你就回答“原文中没有相关内容,我是小学生,知识有限”。
        2.如果用户的问题${question}与{context}无关,但是知识库中没有相关的内容，你就回答“我是小学生,知识有限,你的问题超出了我的想象”。
        3.如果用户的问题${question}与{context}有关,并且知识库中有相关的内容，根据用户问题${question}引用{context}回答。
     `,
    ],
    new MessagesPlaceholder("history"),
    ["human", "现在，你需要基于原文，回答以下问题：\n{standalone_question}`"],
  ])
