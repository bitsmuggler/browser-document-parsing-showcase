# 🧠 PDF to Structured JSON Parser (Client-Side, WebGPU)

This project is a browser-based application that uses [WebLLM](https://webllm.mlc.ai/) to extract text from PDFs and convert it into **structured JSON**-based on a predefined or custom Zod schema.

👉🏻 Take a look at the [Live-Demo](https://browser-document-parsing-showcase.vercel.app/).

👉🏻 Take a look at the comprehensive blog post: [Parsing PDFs with AI - How I Built a Zero-Trust, Client-Only PDF Parser in the Browser](https://www.workingsoftware.dev/parsing-pdf-with-ai-zero-trust-client-only/)

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