/**
 * 定义 Runnable 相关的基本类型和接口
 */

/**
 * 定义 Runnable 配置参数类型
 */
export type RunnableConfig = Record<string, any>

/**
 * Runnable 基础接口定义
 */
export interface RunnableInterface<
  RunInput = any,
  RunOutput = any,
  CallOptions extends RunnableConfig = RunnableConfig,
> {
  name?: string
  invoke(input: RunInput, options?: Partial<CallOptions>): Promise<RunOutput>
  batch?(
    inputs: RunInput[],
    options?: Partial<CallOptions> | Partial<CallOptions>[],
    batchOptions?: Record<string, any>,
  ): Promise<RunOutput[]>
  stream?(input: RunInput, options?: Partial<CallOptions>): Promise<ReadableStream<RunOutput>>
}

/**
 * RunnableFunc 函数类型定义
 */
export type RunnableFunc<RunInput, RunOutput, CallOptions extends RunnableConfig = RunnableConfig> = (
  input: RunInput,
  options: CallOptions | Record<string, any> | (Record<string, any> & CallOptions),
) => RunOutput | Promise<RunOutput>

/**
 * RunnableMapLike 类型定义 - 前向声明
 */
export type RunnableMapLike<RunInput, RunOutput> = {
  [K in keyof RunOutput]: RunnableLike<RunInput, RunOutput[K]>
}

/**
 * RunnableLike 类型定义
 */
export type RunnableLike<RunInput = any, RunOutput = any, CallOptions extends RunnableConfig = RunnableConfig> =
  | RunnableInterface<RunInput, RunOutput, CallOptions>
  | RunnableFunc<RunInput, RunOutput, CallOptions>
  | RunnableMapLike<RunInput, RunOutput>

/**
 * RunnableSequence 配置接口
 */
export interface RunnableSequenceFields<RunInput, RunOutput> {
  first: RunnableInterface<RunInput>
  middle?: RunnableInterface[]
  last: RunnableInterface<any, RunOutput>
  name?: string
}
