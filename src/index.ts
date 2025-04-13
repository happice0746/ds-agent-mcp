import path from "path";
import MCPClient from "./MCPClient";
import Agent from "./Agent";

const outPath = path.join(process.cwd(), 'output');

async function main() {
  const fetchMCP = new MCPClient('fetch', 'uvx', ['mcp-server-fetch'])
  const fileMCP = new MCPClient("mcp-server-file", "npx", ['-y', '@modelcontextprotocol/server-filesystem', outPath]);
  const agent = new Agent("deepseek-chat", "", [fetchMCP, fileMCP], "");
  await agent.init();
  await agent.invoke("告诉我今天北京的天气情况, 写入本地文件夹")
  // await agent.invoke("请爬取这个网站的内容https://movie.douban.com/top250并输出到我本地的文件夹")
}

main()