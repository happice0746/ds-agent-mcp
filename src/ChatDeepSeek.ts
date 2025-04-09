import OpenAI from "openai"
import { Tool } from "@modelcontextprotocol/sdk/types.js"
import { logTitle } from "./logUtils";
import "dotenv/config"
class ChatDeepSeek {
  private llm: OpenAI
  private model: string
  private messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  private tools: Tool[]

  constructor(model: string, systemPrompt: string = "", tools: Tool[] = [], context: string="") {
    this.llm = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL
    })
    this.model = model;
    this.tools = tools;
    if (systemPrompt) {
      this.messages.push({role: "system", content: systemPrompt})
    }
    if (context) {
      this.messages.push({role:"user", content: context})
    }
  }

  async chat(prompt?: string) {
    logTitle("CHAT");
    if (prompt) {
      this.messages.push({ role: "user", content: prompt });
    }
    const stream = await this.llm.chat.completions.create({
      messages: this.messages,
      model: this.model,
      stream: true,
      // tools: this.getToolsDefinition(),
    });
    let content = "";
    let toolCalls = [];
    logTitle("RESPONSE")
    for await (const chunk of stream) {
      let delta = chunk.choices[0].delta;
      if (delta.tool_calls) {
        for(const toolCallChunk of delta.tool_calls) {
          if (toolCalls.length <= toolCallChunk.index) {
            toolCalls.push({id:"", function:{name:"", arguments:""}})
          }
        }
      }
      if (delta.content) {
        content+=delta.content;
        process.stdout.write(delta.content)
      }
    }
    this.messages.push({ 
      role: "assistant", 
      content: content, 
      tool_calls: toolCalls.map(call => ({ 
        id: call.id, 
        type: "function", 
        function: call.function
      }))});
    return {content, toolCalls}
  }

  private getToolsDefinition(): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return this.tools.map((tool) => ({
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
        },
    }));
  }

  public appendToolResult(toolCallId: string, toolOutput: string) {
    this.messages.push({
        role: "tool",
        content: toolOutput,
        tool_call_id: toolCallId
    });
  }

}

export default ChatDeepSeek;