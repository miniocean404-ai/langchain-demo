declare namespace NodeJS {
  declare interface ProcessEnv {
    // openapi key
    OPENAI_API_KEY: string
    // openai 接口基础地址
    OPENAI_BASE_URL: string
  }
}
