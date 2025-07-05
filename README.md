# Dify Knowledge MCP Server

这是一个基于Model Context Protocol (MCP)的服务器，用于访问Dify知识库。它可以让AI助手（如Cursor）直接查询你的Dify知识库内容。

## 功能特性

- 🔍 查询Dify知识库内容
- 📊 支持多种搜索方法（语义搜索、全文搜索、混合搜索）
- 🎯 支持重新排序结果
- ⚙️ 灵活的配置选项
- 🛠️ 标准MCP协议支持

## 安全警告

⚠️ **重要：保护你的API密钥**
- 永远不要在代码中硬编码API密钥
- 不要将包含敏感信息的.env文件提交到版本控制
- 使用.env文件或环境变量来存储敏感配置
- 定期更新你的API密钥

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置API信息

你需要提供两个重要信息：
- **Dataset ID**: 你的Dify知识库ID
- **API Key**: 你的Dify API密钥

### 3. 配置API密钥

#### 方式1：使用.env文件（推荐）

```bash
# 复制配置模板
cp env.example .env

# 编辑.env文件，填入你的真实配置
# DIFY_API_URL=https://api.dify.ai/v1/datasets/YOUR_DATASET_ID/documents/query
# DIFY_API_KEY=your_actual_api_key
```

#### 方式2：环境变量

```bash
# Linux/Mac
export DIFY_API_URL="https://api.dify.ai/v1/datasets/YOUR_DATASET_ID/documents/query"
export DIFY_API_KEY="your_actual_api_key"
```

```cmd
# Windows
set DIFY_API_URL=https://api.dify.ai/v1/datasets/YOUR_DATASET_ID/documents/query
set DIFY_API_KEY=your_actual_api_key
```

#### 方式3：命令行参数

```bash
node index.js --api-url="https://api.dify.ai/v1/datasets/YOUR_DATASET_ID/documents/query" --api-key="your_actual_api_key"
```

### 4. 运行服务器

```bash
node index.js
```

## 在Cursor中使用

### 1. 配置MCP服务器

在Cursor中，你需要配置MCP服务器。创建或编辑你的MCP配置文件：

```json
{
  "mcpServers": {
    "dify-knowledge": {
      "command": "node",
      "args": [
        "/path/to/your/dify-knowledge-mcp-server/index.js"
      ],
      "env": {
        "DIFY_API_URL": "https://api.dify.ai/v1/datasets/YOUR_DATASET_ID/documents/query",
        "DIFY_API_KEY": "your_actual_api_key"
      }
    }
  }
}
```

**注意：** 替换上面的占位符为你的实际值：
- `YOUR_DATASET_ID`: 你的Dify知识库ID
- `your_actual_api_key`: 你的Dify API密钥
- `/path/to/your/dify-knowledge-mcp-server/index.js`: 你的项目路径

### 2. 可用的工具函数

配置完成后，Cursor可以使用以下工具：

#### `query_dify_knowledge`
查询Dify知识库内容

**参数:**
- `query` (必需): 搜索查询词
- `top_k` (可选): 返回结果数量，默认为3
- `search_method` (可选): 搜索方法，可选值：
  - `semantic_search`: 语义搜索
  - `full_text_search`: 全文搜索
  - `hybrid_search`: 混合搜索（默认）
- `reranking_enable` (可选): 启用重新排序，默认为true

**示例:**
```
请查询关于"产品介绍"的相关内容
```

#### `get_dify_config`
检查当前Dify API配置状态

## 使用示例

### 在Cursor中的对话示例

```
用户: 请帮我查询知识库中关于"用户手册"的内容

AI助手: 我来为你查询Dify知识库中关于"用户手册"的内容...
[调用query_dify_knowledge工具]

找到了3个相关的知识条目：

1. (Score: 0.95)
用户手册第一章介绍了产品的基本功能和使用方法...

2. (Score: 0.87)
用户手册第二章详细说明了高级功能的配置步骤...

3. (Score: 0.82)
用户手册常见问题解答部分提供了问题解决方案...
```

## 配置说明

### API URL格式
```
https://api.dify.ai/v1/datasets/{dataset_id}/documents/query
```

### 支持的搜索方法
- **semantic_search**: 基于语义理解的搜索
- **full_text_search**: 传统的全文搜索
- **hybrid_search**: 结合语义和全文搜索的混合模式

### 重新排序
启用重新排序可以提高搜索结果的相关性，但可能会增加响应时间。

## 故障排除

### 常见问题

1. **"Please configure DIFY_API_URL and DIFY_API_KEY"**
   - 确保API URL和API Key已正确配置
   - 检查Dataset ID是否正确

2. **"Failed to retrieve knowledge from Dify"**
   - 检查API Key是否有效
   - 确认Dataset ID是否存在
   - 验证网络连接

3. **连接超时**
   - 检查网络连接
   - 确认Dify API服务是否可访问

### 测试配置

运行以下命令测试配置：

```bash
# 测试配置状态
node index.js
```

如果看到"Ready to query knowledge base!"消息，说明配置正确。

### 清理敏感信息

如果你之前在配置文件中暴露了API密钥，请立即：

1. **更新Cursor配置文件** (通常在 `~/.cursor/mcp.json` 或类似路径)
2. **删除或更换暴露的API密钥**
3. **检查版本控制历史** 确保没有提交敏感信息
4. **使用新的配置方法** 通过.env文件或环境变量

## 开发信息

- **协议**: Model Context Protocol (MCP)
- **传输方式**: Standard I/O
- **API版本**: Dify API v1
- **Node.js版本**: 支持ES模块的版本

## 许可证

ISC License