/**
 * RunnableMap 实现
 */
import { RunnableConfig, RunnableMapLike } from "./types.js"
import { Runnable } from "./runnable.js"
import { _coerceToRunnable } from "./utils.js"

// 声明为命名空间而不是直接导出，避免循环引用
namespace RunnableMapModule {
  /**
   * RunnableMap - 并行运行多个Runnable
   */
  export class RunnableMap<
    RunInput = any,
    RunOutput extends Record<string, any> = Record<string, any>,
  > extends Runnable<RunInput, RunOutput> {
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
}

// 导出命名空间中的类
export const RunnableMap = RunnableMapModule.RunnableMap
