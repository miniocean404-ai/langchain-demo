/**
 * RunnableLambda 实现
 */
import { RunnableConfig, RunnableFunc } from "./types.js"
import { Runnable } from "./runnable.js"

// 声明为命名空间而不是直接导出，避免循环引用
namespace RunnableLambdaModule {
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
}

// 导出命名空间中的类
export const RunnableLambda = RunnableLambdaModule.RunnableLambda
