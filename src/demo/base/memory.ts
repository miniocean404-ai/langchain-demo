import { getBufferString, HumanMessage } from "@langchain/core/messages"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { RunnablePassthrough, RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables"
import { ChatMessageHistory } from "langchain/memory"
import { model } from "src/demo/base/openai.js"

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a helpful assistant. Answer all questions to the best of your ability. You are talkative and provides lots of specific details from its context. If the you does not know the answer to a question, it truthfully says you do not know.",
  ],
  // 含义：https://juejin.cn/post/7463378542546878464#heading-4
  new MessagesPlaceholder("history_message"),
])
const chain = prompt.pipe(model)

export async function historyMessage() {
  const history = new ChatMessageHistory()
  await history.addMessage(new HumanMessage("我叫 Langchain 杀手"))
  const chunk1 = await chain.invoke({
    history_message: await history.getMessages(),
  })
  await history.addMessage(chunk1)
  await history.addMessage(new HumanMessage("我叫什么名字?"))
  const chunk2 = await chain.invoke({
    // 获取所有的历史记录
    history_message: await history.getMessages(),
  })
}

// 聊天记录管理
export async function chatManage() {
  const history = new ChatMessageHistory()

  // runnable：需要被包裹的 chain，可以是任意 chain。
  // getMessageHistory：接收一个函数，函数根据传入的 _sessionId 获取对应的 ChatMessageHistory 对象。
  // inputMessagesKey：用户传入信息的 key 名称，用于自动记录用户输入。
  // historyMessagesKey：聊天记录在 prompt 中的 key，用于自动将聊天记录注入到 prompt 中。
  // outputMessagesKey：如果 chain 有多个输出，需要指定哪个是 LLM 的回复，即需要存储的信息
  const chainWithHistory = new RunnableWithMessageHistory({
    runnable: chain,
    getMessageHistory: (_sessionId) => history,
    inputMessagesKey: "input",
    historyMessagesKey: "history_message",
  })

  const res1 = await chainWithHistory.invoke(
    {
      input: "我叫 langchain 杀手",
    },
    {
      configurable: { sessionId: "none" },
    },
  )
  const res2 = await chainWithHistory.invoke(
    {
      input: "我的名字叫什么？",
    },
    {
      configurable: { sessionId: "none" },
    },
  )
}

// 历史记录摘有
export async function historyMessageSummary() {
  const summaryPrompt = ChatPromptTemplate.fromTemplate(`
        Progressively summarize the lines of conversation provided, adding onto the previous summary returning a new summary
        Current summary:
        {summary}
        New lines of conversation:
        {new_lines}
        New summary:
        `)

  const summaryChain = RunnableSequence.from([summaryPrompt, model, new StringOutputParser()])

  // 通过不断调用可以逐步生成聊天记录的摘要
  const newSummary = await summaryChain.invoke({
    summary: "",
    new_lines: "我叫浪遏",
  })

  await summaryChain.invoke({
    // summary（上一次总结的信息）
    summary: newSummary,
    // new_lines（用户和 LLM 新的回复）
    new_lines: "我是一名学生",
  })
}

// 聊天记录的存储、摘要生成和自动维护
export async function memoryDemo() {
  const chatPrompt = ChatPromptTemplate.fromTemplate(``)

  const history = new ChatMessageHistory()

  const summaryPrompt = ChatPromptTemplate.fromTemplate(`
    Progressively summarize the lines of conversation provided, adding onto the previous summary returning a new summary
    Current summary:
    {summary}
    New lines of conversation:
    {new_lines}
    New summary:
    `)

  const summaryChain = RunnableSequence.from([summaryPrompt, model, new StringOutputParser()])

  // 通过不断调用可以逐步生成聊天记录的摘要
  let summary = await summaryChain.invoke({
    summary: "",
    new_lines: "我叫浪遏",
  })

  // 使用 RunnableSequence.from 方法创建一个可运行的序列 chatChain
  // 该序列会按顺序依次执行其中的每个可运行对象
  const chatChain = RunnableSequence.from([
    {
      // 创建一个包含输入的对象，使用 RunnablePassthrough 来传递输入数据
      // 同时，在传递过程中执行自定义函数 func
      // func 函数的作用是将用户输入的消息添加到聊天历史记录 history 中
      input: new RunnablePassthrough({
        func: (input: string) => history.addUserMessage(input),
      }),
    },
    // 使用 RunnablePassthrough.assign 方法将额外的数据添加到输入对象中
    // 这里将历史摘要 history_summary 添加到输入对象中，其值为变量 summary
    RunnablePassthrough.assign({
      history_summary: () => summary,
    }),
    // 将聊天提示模板 chatPrompt 作为序列的一部分
    // 它会根据输入数据生成合适的提示信息
    chatPrompt,
    // 将聊天模型 chatModel 作为序列的一部分
    // 它会根据生成的提示信息生成回复
    model,
    // 使用 StringOutputParser 将模型的输出解析为字符串
    new StringOutputParser(),
    // 再次使用 RunnablePassthrough 传递解析后的字符串输出
    // 同时执行自定义函数 func 进行一系列操作
    new RunnablePassthrough({
      func: async (input: string) => {
        // 将模型的回复添加到聊天历史记录 history 中
        history.addAIMessage(input)
        // 获取聊天历史记录中的所有消息
        const messages = await history.getMessages()
        // 将消息列表转换为字符串
        const new_lines = getBufferString(messages)
        // 调用摘要生成链 summaryChain，根据当前摘要 summary 和新的聊天内容 new_lines 生成新的摘要
        const newSummary = await summaryChain.invoke({
          summary,
          new_lines,
        })
        // 清空聊天历史记录
        history.clear()
        // 更新摘要为新生成的摘要
        summary = newSummary
      },
    }),
  ])
}
