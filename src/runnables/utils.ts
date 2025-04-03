/**
 * Runnable 实用工具函数
 */
import { RunnableLike, RunnableInterface, RunnableMapLike } from "./types.js"
import { Runnable } from "./runnable.js"
import { RunnableLambda } from "./runnable-lambda.js"
import { RunnableMap } from "./runnable-map.js"

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

      async invoke(input: RunInput, options?: Record<string, any>): Promise<RunOutput> {
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
