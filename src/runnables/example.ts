/**
 * RunnableSequence使用示例
 */
import { RunnableSequence, RunnableMap, Runnable } from "./index.js"

async function main() {
  console.log("========== RunnableSequence示例 ==========")

  // 基础序列示例
  console.log("\n1. 基础序列处理")
  const textProcessingSequence = RunnableSequence.from([
    // 步骤1: 文本转大写
    async (input: string) => {
      return input.toUpperCase()
    },

    // 步骤2: 添加前缀
    (input: string) => {
      console.log("步骤2: 添加前缀")
      return `处理结果: ${input}`
    },

    // 步骤3: 添加详细信息
    (input: string) => {
      console.log("步骤3: 添加详细信息")
      const timestamp = new Date().toISOString()
      return {
        result: input,
        metadata: {
          processedAt: timestamp,
          length: input.length,
        },
      }
    },
  ])

  try {
    const result = await textProcessingSequence.invoke("hello world")
    console.log("基础序列结果:", JSON.stringify(result, null, 2))
  } catch (error) {
    console.error("基础序列处理失败:", error)
  }

  // 并行处理示例
  console.log("\n2. 并行处理 (RunnableMap)")
  const parallelProcessing = RunnableMap.from({
    uppercase: (input: string) => input.toUpperCase(),
    length: (input: string) => input.length,
    reversed: (input: string) => input.split("").reverse().join(""),
    wordCount: (input: string) => input.split(/\s+/).length,
  })

  try {
    const mapResult = await parallelProcessing.invoke("hello runnable world")
    console.log("并行处理结果:", JSON.stringify(mapResult, null, 2))
  } catch (error) {
    console.error("并行处理失败:", error)
  }

  // 复杂序列示例
  console.log("\n3. 复杂序列组合")
  const complexSequence = RunnableSequence.from([
    // 步骤1: 文本预处理
    (input: string) => {
      console.log("步骤1: 文本预处理")
      return input.trim().toLowerCase()
    },

    // 步骤2: 并行分析
    RunnableMap.from({
      textInfo: (input: string) => ({
        length: input.length,
        wordCount: input.split(/\s+/).length,
        hasNumbers: /\d/.test(input),
      }),
      transformations: (input: string) => ({
        original: input,
        uppercase: input.toUpperCase(),
        reversed: input.split("").reverse().join(""),
      }),
    }),

    // 步骤3: 结果整合
    (input: any) => {
      console.log("步骤3: 结果整合")
      return {
        summary: `处理了一个长度为${input.textInfo.length}字符的文本，包含${input.textInfo.wordCount}个单词`,
        analysisTime: new Date().toISOString(),
        statistics: input.textInfo,
        variants: input.transformations,
      }
    },
  ])

  try {
    const complexResult = await complexSequence.invoke("  Hello Complex Runnable World 123  ")
    console.log("复杂序列结果:", JSON.stringify(complexResult, null, 2))
  } catch (error) {
    console.error("复杂序列处理失败:", error)
  }

  // 链式调用示例
  console.log("\n4. 链式调用 (pipe方法)")

  // 创建自定义Runnable类
  class TextNormalizer extends Runnable<string, string> {
    async invoke(input: string): Promise<string> {
      console.log("自定义Runnable: 文本标准化")
      return input.trim().toLowerCase()
    }
  }

  try {
    // 使用 await 来处理异步的 pipe 方法
    const pipeStep1 = await new TextNormalizer().pipe((input: string) => {
      console.log("管道步骤1: 提取特征")
      return {
        text: input,
        features: {
          length: input.length,
          firstChar: input.charAt(0),
          lastChar: input.charAt(input.length - 1),
        },
      }
    })

    // 继续链式调用
    const pipeline = await pipeStep1.pipe((input: any) => {
      console.log("管道步骤2: 生成最终输出")
      return {
        originalText: input.text,
        analysis: input.features,
        summary: `文本长度为${input.features.length}字符，以"${input.features.firstChar}"开头，以"${input.features.lastChar}"结尾`,
      }
    })

    const pipeResult = await pipeline.invoke("  Hello Pipe Method!  ")
    console.log("链式调用结果:", JSON.stringify(pipeResult, null, 2))
  } catch (error) {
    console.error("链式调用失败:", error)
  }

  // 批处理示例
  console.log("\n5. 批处理 (batch方法)")
  const simpleProcessor = RunnableSequence.from([
    (input: string) => input.toUpperCase(),
    (input: string) => `结果: ${input}`,
  ])

  try {
    const batchInputs = ["first input", "second input", "third input"]
    const batchResults = await simpleProcessor.batch(batchInputs)
    console.log("批处理结果:")
    batchResults.forEach((result, index) => {
      console.log(`  [${index}]: ${result}`)
    })
  } catch (error) {
    console.error("批处理失败:", error)
  }
}

// 运行主函数
main().catch((error) => {
  console.error("程序执行出错:", error)
})
