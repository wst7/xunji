import { fetchArticle } from './article'
import { emitChange } from './bus'
import { summarizeWithLlm } from './llm'
import * as repo from './repo'
import { oneLine } from './util'

/**
 * 本机处理队列：抓取 → 解析 → 摘要 → 落库。
 *
 * 没有服务端 worker，所以单飞、串行处理；一次最多处理 20 条，
 * 剩下的等下次保存、回到前台或手动刷新时继续。
 */
let running = false

export function isProcessing(): boolean {
  return running
}

export async function processPendingQueue(): Promise<void> {
  if (running) return
  running = true
  try {
    for (let i = 0; i < 20; i += 1) {
      const next = await repo.nextPending()
      if (!next) break
      await processOne(next.id, next.url)
    }
  } finally {
    running = false
    emitChange()
  }
}

async function processOne(id: string, url: string): Promise<void> {
  await repo.setStatus(id, 'fetching', 'fetch')
  emitChange()

  let article
  try {
    article = await fetchArticle(url)
  } catch {
    await repo.markFailed(id, 'FETCH_FAILED')
    emitChange()
    return
  }

  await repo.setStatus(id, 'parsing', 'parse')

  // 和原来的后端语义一致：正文太短只算部分成功，元信息照常保留。
  if (article.plainText.length < 120) {
    await repo.savePartial(id, article)
    emitChange()
    return
  }

  await repo.setStatus(id, 'analyzing', 'summarize')
  emitChange()

  const title = article.title ?? url
  let summary = ''
  let keywords: string[] = []

  const llm = await summarizeWithLlm({ title, url, text: article.plainText })
  if (llm) {
    summary = llm.summary
    keywords = llm.keywords
  }
  if (!summary) {
    // 抽取式兜底：只用原文里的描述或开头，不生成原文没有的内容。
    summary = article.description ?? oneLine(article.plainText, 220)
  }

  await repo.saveParsed(id, article, summary, oneLine(summary, 160), keywords)
  emitChange()
}
