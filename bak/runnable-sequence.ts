/**
 * RunnableSequence实现
 * 从LangChain.js提取并修改
 */
// 定义基本类型和接口
export type RunnableConfig = Record<string, any>

export interface RunnableInterface<
  RunInput = any,
  RunOutput = any,
  CallOptions extends RunnableConfig = RunnableConfig,
> {
  invoke(input: RunInput, options?: Partial<CallOptions>): Promise<RunOutput>
  batch?(
    inputs: RunInput[],
    options?: Partial<CallOptions> | Partial<CallOptions>[],
    batchOptions?: Record<string, any>,
  ): Promise<RunOutput[]>
  stream?(input: RunInput, options?: Partial<CallOptions>): Promise<ReadableStream<RunOutput>>
}

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
  pipe<NewOutput>(coerceable: RunnableLike<RunOutput, NewOutput>): RunnableSequence<RunInput, NewOutput> {
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

/**
 * RunnableFunc类型定义
 */
export type RunnableFunc<RunInput, RunOutput, CallOptions extends RunnableConfig = RunnableConfig> = (
  input: RunInput,
  options: CallOptions | Record<string, any> | (Record<string, any> & CallOptions),
) => RunOutput | Promise<RunOutput>

/**
 * RunnableMapLike类型定义
 */
export type RunnableMapLike<RunInput, RunOutput> = {
  [K in keyof RunOutput]: RunnableLike<RunInput, RunOutput[K]>
}

/**
 * RunnableLike类型定义
 */
export type RunnableLike<RunInput = any, RunOutput = any, CallOptions extends RunnableConfig = RunnableConfig> =
  | RunnableInterface<RunInput, RunOutput, CallOptions>
  | RunnableFunc<RunInput, RunOutput, CallOptions>
  | RunnableMapLike<RunInput, RunOutput>

/**
 * 将值转换为字典形式
 */
export function _coerceToDict(value: any, defaultKey: string) {
  return value && !Array.isArray(value) && !(value instanceof Date) && typeof value === "object"
    ? value
    : { [defaultKey]: value }
}

/**
 * 检查对象是否实现RunnableInterface接口
 */
export function isRunnableInterface(thing: any): thing is RunnableInterface {
  return thing && typeof thing.invoke === "function"
}

/**
 * 将任何RunnableLike类型转换为Runnable对象
 */
export function _coerceToRunnable<RunInput, RunOutput>(
  coerceable: RunnableLike<RunInput, RunOutput>,
): Runnable<RunInput, RunOutput> {
  if (typeof coerceable === "function") {
    return new RunnableLambda<RunInput, RunOutput>({ func: coerceable })
  } else if (isRunnableInterface(coerceable)) {
    if ("lc_runnable" in coerceable) {
      return coerceable as unknown as Runnable<RunInput, RunOutput>
    }

    class Coerced extends Runnable<RunInput, RunOutput> {
      constructor(private readonly runnable: RunnableInterface<RunInput, RunOutput>) {
        super()
      }

      async invoke(input: RunInput, options?: RunnableConfig): Promise<RunOutput> {
        return this.runnable.invoke(input, options)
      }
    }

    return new Coerced(coerceable)
  } else {
    // 在这里添加类型断言，确保RunOutput是Record<string, any>类型
    return new RunnableMap<RunInput, RunOutput & Record<string, any>>({
      steps: coerceable as RunnableMapLike<RunInput, RunOutput & Record<string, any>>,
    }) as unknown as Runnable<RunInput, RunOutput>
  }
}

/**
 * RunnableLambda - 函数包装器
 */
export class RunnableLambda<RunInput, RunOutput> extends Runnable<RunInput, RunOutput> {
  private func: RunnableFunc<RunInput, RunOutput>

  constructor(fields: { func: RunnableFunc<RunInput, RunOutput>; name?: string }) {
    super()
    this.func = fields.func
    this.name = fields.name
  }

  async invoke(input: RunInput, options?: RunnableConfig): Promise<RunOutput> {
    return this.func(input, options || {})
  }
}

/**
 * RunnableMap - 并行运行多个Runnable
 */
export class RunnableMap<RunInput = any, RunOutput extends Record<string, any> = Record<string, any>> extends Runnable<
  RunInput,
  RunOutput
> {
  protected steps: Record<string, Runnable<RunInput>>

  constructor(fields: { steps: RunnableMapLike<RunInput, RunOutput>; name?: string }) {
    super()
    this.name = fields.name
    this.steps = {}
    for (const [key, value] of Object.entries(fields.steps)) {
      this.steps[key] = _coerceToRunnable(value)
    }
  }

  public getStepsKeys(): string[] {
    return Object.keys(this.steps)
  }

  static from<RunInput, RunOutput extends Record<string, any> = Record<string, any>>(
    steps: RunnableMapLike<RunInput, RunOutput>,
    name?: string,
  ): RunnableMap<RunInput, RunOutput> {
    return new RunnableMap<RunInput, RunOutput>({ steps, name })
  }

  async invoke(input: RunInput, options?: Partial<RunnableConfig>): Promise<RunOutput> {
    const output: Record<string, any> = {}

    const promises = Object.entries(this.steps).map(async ([key, runnable]) => {
      output[key] = await runnable.invoke(input, options)
    })

    await Promise.all(promises)
    return output as RunOutput
  }
}

/**
 * RunnableSequence配置接口
 */
export interface RunnableSequenceFields<RunInput, RunOutput> {
  first: Runnable<RunInput>
  middle?: Runnable[]
  last: Runnable<any, RunOutput>
  name?: string
}

/**
 * RunnableSequence - 顺序执行多个Runnable
 */
export class RunnableSequence<RunInput = any, RunOutput = any> extends Runnable<RunInput, RunOutput> {
  protected first: Runnable<RunInput>
  protected middle: Runnable[] = []
  protected last: Runnable<any, RunOutput>

  constructor(fields: RunnableSequenceFields<RunInput, RunOutput>) {
    super()
    this.first = fields.first
    this.middle = fields.middle ?? this.middle
    this.last = fields.last
    this.name = fields.name
  }

  get steps() {
    return [this.first, ...this.middle, this.last]
  }

  async invoke(input: RunInput, options?: RunnableConfig): Promise<RunOutput> {
    let nextStepInput = input

    // 执行first和middle步骤
    const initialSteps = [this.first, ...this.middle]
    for (let i = 0; i < initialSteps.length; i += 1) {
      const step = initialSteps[i]
      nextStepInput = await step.invoke(nextStepInput, options)
    }

    // 执行最后一个步骤
    return this.last.invoke(nextStepInput, options)
  }

  /**
   * 从Runnable数组创建RunnableSequence
   */
  static from<RunInput = any, RunOutput = any>(
    [first, ...runnables]: [RunnableLike<RunInput>, ...RunnableLike[], RunnableLike<any, RunOutput>],
    nameOrFields?: string | Omit<RunnableSequenceFields<RunInput, RunOutput>, "first" | "middle" | "last">,
  ) {
    let extra: Record<string, unknown> = {}
    if (typeof nameOrFields === "string") {
      extra.name = nameOrFields
    } else if (nameOrFields !== undefined) {
      extra = nameOrFields
    }

    return new RunnableSequence<RunInput, RunOutput>({
      ...extra,
      first: _coerceToRunnable(first),
      middle: runnables.slice(0, -1).map(_coerceToRunnable),
      last: _coerceToRunnable(runnables[runnables.length - 1]),
    })
  }
}
