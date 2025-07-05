#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ErrorCode,
    McpError
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';
import dotenv from 'dotenv';

// 加载.env文件
dotenv.config();

// Dify API 配置
const args = process.argv.slice(2);
let DIFY_API_URL = '';
let DIFY_API_KEY = '';

// 解析命令行参数
for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--api-url=')) {
        DIFY_API_URL = args[i].substring('--api-url='.length);
    } else if (args[i].startsWith('--api-key=')) {
        DIFY_API_KEY = args[i].substring('--api-key='.length);
    }
}

// 使用环境变量作为默认值
if (!DIFY_API_URL) {
    DIFY_API_URL = process.env.DIFY_API_URL || '';
}
if (!DIFY_API_KEY) {
    DIFY_API_KEY = process.env.DIFY_API_KEY || '';
}

// 创建MCP服务器实例
const server = new Server(
    {
        name: "dify-knowledge-mcp-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Dify API 调用函数
async function queryDifyKnowledge(query, options = {}) {
    if (!query) {
        throw new McpError(ErrorCode.InvalidRequest, 'Query parameter is required');
    }

    if (!DIFY_API_URL || !DIFY_API_KEY) {
        throw new McpError(ErrorCode.InvalidRequest, 'Please configure DIFY_API_URL and DIFY_API_KEY in .env file, environment variables, or command line arguments');
    }

    try {
        const headers = {
            'Authorization': `Bearer ${DIFY_API_KEY}`,
            'Content-Type': 'application/json'
        };

        const payload = {
            query: query,
            retrieval_model: {
                search_method: options.search_method || 'hybrid_search',
                reranking_enable: options.reranking_enable || true,
                reranking_mode: options.reranking_mode || 'reranking_model',
                reranking_model: {
                    reranking_provider_name: '',
                    reranking_model_name: ''
                },
                weights: null,
                top_k: options.top_k || 3,
                score_threshold_enabled: options.score_threshold_enabled || false,
                score_threshold: options.score_threshold || null
            }
        };

        const response = await axios.post(DIFY_API_URL, payload, { headers });

        // 提取并返回records中的content字段
        const contents = response.data.records.map(record => ({
            content: record.segment.content,
            score: record.score,
            position: record.position
        }));

        return {
            success: true,
            data: contents,
            total_count: response.data.records.length
        };

    } catch (error) {
        console.error('Error calling Dify API:', error.response ? error.response.data : error.message);
        throw new McpError(
            ErrorCode.InternalError,
            `Failed to retrieve knowledge from Dify: ${error.response ? error.response.data.message : error.message}`
        );
    }
}

// 注册工具函数
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "query_dify_knowledge",
                description: "Query Dify knowledge base with a search query",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The search query to find relevant knowledge"
                        },
                        top_k: {
                            type: "number",
                            description: "Number of results to return (default: 3)",
                            default: 3
                        },
                        search_method: {
                            type: "string",
                            description: "Search method to use",
                            enum: ["semantic_search", "full_text_search", "hybrid_search"],
                            default: "hybrid_search"
                        },
                        reranking_enable: {
                            type: "boolean",
                            description: "Enable reranking of search results",
                            default: true
                        }
                    },
                    required: ["query"]
                }
            },
            {
                name: "get_dify_config",
                description: "Get current Dify API configuration status",
                inputSchema: {
                    type: "object",
                    properties: {}
                }
            }
        ]
    };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
        case "query_dify_knowledge":
            try {
                const result = await queryDifyKnowledge(args.query, {
                    top_k: args.top_k,
                    search_method: args.search_method,
                    reranking_enable: args.reranking_enable
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Found ${result.total_count} relevant knowledge entries:\n\n` +
                                result.data.map((item, index) =>
                                    `${index + 1}. (Score: ${item.score})\n${item.content}\n`
                                ).join('\n')
                        }
                    ]
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error.message}`
                        }
                    ],
                    isError: true
                };
            }

        case "get_dify_config":
            const isConfigured = DIFY_API_URL && DIFY_API_KEY;

            return {
                content: [
                    {
                        type: "text",
                        text: `Dify Configuration Status:
                        
API URL: ${DIFY_API_URL ? '✓ Configured' : '✗ Not configured'}
API Key: ${DIFY_API_KEY ? '✓ Configured' : '✗ Not configured'}

${isConfigured ? 'Ready to query knowledge base!' : 'Please configure DIFY_API_URL and DIFY_API_KEY in .env file, environment variables, or command line arguments.'}`
                    }
                ]
            };

        default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
});

// 启动服务器
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Dify MCP server is running on stdio");
    console.error("Configuration:");
    console.error(`  API URL: ${DIFY_API_URL ? 'Configured' : 'Not configured'}`);
    console.error(`  API Key: ${DIFY_API_KEY ? 'Configured' : 'Not configured'}`);
}

runServer().catch(console.error);