import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio"
import { DirectoryLoader } from "langchain/document_loaders/fs/directory"
import { TextLoader } from "langchain/document_loaders/fs/text"

export async function cheerioLoader() {
  const loader = new CheerioWebBaseLoader("https://zh.wikipedia.org/wiki/%E5%8C%BB%E7%94%9F", {
    selector: "#mw-content-text > div.mw-content-ltr.mw-parser-output",
  })

  return await loader.load()
}

export async function directoryLoader() {
  const loader = new DirectoryLoader("src/assets", {
    ".pdf": (path) => new PDFLoader(path, { splitPages: false }),
    ".txt": (path) => new TextLoader(path),
  })

  return await loader.load()
}
