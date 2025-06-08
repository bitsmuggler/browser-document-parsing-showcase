# 🧠 PDF to Structured JSON Parser (Client-Side, WebGPU)

This project is a browser-based application that uses [WebLLM](https://webllm.mlc.ai/) to extract text from PDFs and convert it into **structured JSON**—based on a predefined or custom Zod schema.

⚡ It runs **entirely in the browser** using WebGPU. No server or cloud connection is required for inference.

---

## ✨ Features

- ✅ Local text extraction from PDF documents
- ✅ Client-side Large Language Model (LLM) powered by `@mlc-ai/web-llm`
- ✅ Schema-based JSON output (via [Zod](https://github.com/colinhacks/zod))
- ✅ Live model loading progress UI
- ✅ Option to define a custom schema
- ✅ Completely private: no data leaves your device

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js >= 18
- A browser with WebGPU support  
  ✅ **Recommended:** Chrome 113+ or Edge 113+

### 2. Installation

```bash
git clone https://github.com/your-username/pdf-to-json-webllm.git
cd pdf-to-json-webllm
npm install
