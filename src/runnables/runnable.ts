/**
 * Runnable 抽象基类实现
 */
import { RunnableConfig, RunnableInterface, RunnableLike } from "./types.js"
import { _coerceToRunnable } from "./utils.js"

/**
 * 基础的Runnable抽象类
 */
export abstract class Runnable<RunInput = any, RunOutput = any, CallOptions extends RunnableConfig = RunnableConfig>
  implements RunnableInterface<RunInput, RunOutput, CallOptions>
{
  name?: string

  /**
   * 获取名称
   */
  getName(suffix?: string): string {
    const name = this.name ?? this.constructor.name
    return suffix ? `${name}${suffix}` : name
  }

  /**
   * 执行输入并返回输出
   */
  abstract invoke(input: RunInput, options?: Partial<CallOptions>): Promise<RunOutput>

  /**
   * 将当前Runnable与另一个Runnable连接成一个序列
   */
  async pipe<NewOutput>(coerceable: RunnableLike<RunOutput, NewOutput>): Promise<any> {
    // 动态导入 RunnableSequence
    const module = await import("./runnable-sequence.js")
    const RunnableSequence = module.RunnableSequence

    // 创建 RunnableSequence 实例
    return RunnableSequence.from([this, _coerceToRunnable(coerceable)])
  }

  /**
   * 批处理多个输入
   */
  async batch(
    inputs: RunInput[],
    options?: Partial<CallOptions> | Partial<CallOptions>[],
    batchOptions?: Record<string, any>,
  ): Promise<RunOutput[]> {
    const configList = this._getOptionsList(options ?? {}, inputs.length)
    const returnExceptions = batchOptions?.returnExceptions ?? false

    const results: (RunOutput | Error)[] = await Promise.all(
      inputs.map(async (input, i) => {
        try {
          const result = await this.invoke(input, configList[i] ?? {})
          return result
        } catch (e) {
          if (returnExceptions) {
            return e as Error
          }
          throw e
        }
      }),
    )

    return results as RunOutput[]
  }

  /**
   * 获取配置列表
   */
  protected _getOptionsList(
    options: Partial<CallOptions> | Partial<CallOptions>[],
    length: number,
  ): Partial<CallOptions>[] {
    if (Array.isArray(options)) {
      if (options.length !== length) {
        throw new Error(`Options array length (${options.length}) does not match inputs array length (${length}).`)
      }
      return options
    }
    return Array(length).fill(options)
  }
}
