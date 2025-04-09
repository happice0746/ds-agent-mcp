import ChatDeepSeek from "./ChatDeepSeek";

async function main() {
  const dsClient = new ChatDeepSeek("deepseek-chat")

  const { content, toolCalls } = await dsClient.chat("请问今天徐州多少度");
  console.log(content, toolCalls)
}

main()