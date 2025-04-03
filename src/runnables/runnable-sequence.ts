/**
 * RunnableSequence实现
 */
import { RunnableConfig, RunnableLike, RunnableSequenceFields } from "./types.js"
import { Runnable } from "./runnable.js"
import { _coerceToRunnable } from "./utils.js"

// 声明为命名空间而不是直接导出，避免循环引用
namespace RunnableSequenceModule {
  /**
   * RunnableSequence - 顺序执行多个Runnable
   */
  export class RunnableSequence<RunInput = any, RunOutput = any> extends Runnable<RunInput, RunOutput> {
    protected first: Runnable<RunInput>
    protected middle: Runnable[] = []
    protected last: Runnable<any, RunOutput>

    constructor(fields: RunnableSequenceFields<RunInput, RunOutput>) {
      super()
      this.first = fields.first as Runnable<RunInput>
      this.middle = fields.middle?.map((step) => step as Runnable) ?? this.middle
      this.last = fields.last as Runnable<any, RunOutput>
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
    ): RunnableSequence<RunInput, RunOutput> {
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
}

// 导出命名空间中的类
export const RunnableSequence = RunnableSequenceModule.RunnableSequence
