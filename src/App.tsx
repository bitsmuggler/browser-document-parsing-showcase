import { useEffect, useRef, useState } from "react";
import {
    CreateWebWorkerMLCEngine,
    type MLCEngineInterface,
    prebuiltAppConfig,
    type ChatCompletionRequest,
    type ResponseFormat
} from "@mlc-ai/web-llm";
import PdfTextExtractor from "./PdfExtractor.tsx";
import { z, toJSONSchema } from "zod/v4";

const selectedModel = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

let engine: MLCEngineInterface | null = null;

// ✅ Check if WebGPU is supported
function checkWebGPU(): boolean {
    return !!(navigator as any).gpu;
}

function App() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [engineState, setEngine] = useState<MLCEngineInterface | null>(null);
    const [gpuSupported, setGpuSupported] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState("");
    const intervalRef = useRef<number | null>(null);
    const [schemaType, setSchemaType] = useState<'account' | 'custom'>('account');
    const [customSchema, setCustomSchema] = useState(`z.object({
  name: z.string(),
  email: z.string().email(),
  subscribed: z.boolean()
})`);

    const initProgressCallback = (progress: any) => {
        console.log("Model loading progress:", progress);
        setLoadingProgress(progress.text);
    };

    async function initEngine() {
        const appConfig = prebuiltAppConfig;
        appConfig.useIndexedDBCache = true;

        console.log(appConfig.useIndexedDBCache ? "Using IndexedDB Cache" : "Using Cache API");

        if (!engine) {
            engine = await CreateWebWorkerMLCEngine(
                new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
                selectedModel,
                { initProgressCallback: initProgressCallback as any, appConfig }
            );

            const warmUp = await engine.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a helpful text to json transformer." },
                    { role: "user", content: "Are you ready?" }
                ],
            });

            console.log("Warm-up response:", warmUp.choices[0].message.content);
        }
        return engine;
    }

    const AccountSchema = z.object({
        balance: z.number(),
        account_type: z.string(),
        account_currency: z.string(),
        interest_rate_percent: z.number(),
        bank_name: z.string(),
        iban: z.string(),
        bic_swift: z.string()
    });

    useEffect(() => {
        const supported = checkWebGPU();
        setGpuSupported(supported);

        if (!supported) return;

        console.log('Initializing engine...');
        initEngine()
            .then((engine) => setEngine(engine))
            .catch((err) => console.error("Failed to init engine:", err));
    }, []);

    const startStopwatch = () => {
        const start = performance.now();
        intervalRef.current = window.setInterval(() => {
            const now = performance.now();
            setElapsedTime(((now - start) / 1000).toFixed(1) as any);
        }, 100);
    };

    const stopStopwatch = () => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
        }
    };

    const callLLM = async (text: string) => {
        if (!engineState) {
            setResult("Engine not ready yet. Please wait a moment.");
            return;
        }

        setLoading(true);
        setElapsedTime(0);
        setResult(null);
        startStopwatch();

        let jsonSchema;
        if (schemaType === 'account') {
            jsonSchema = toJSONSchema(AccountSchema);
        } else {
            try {
                // ⚠️ Only safe in trusted environments
                // eslint-disable-next-line no-eval
                const parsedSchema = eval(customSchema);
                jsonSchema = toJSONSchema(parsedSchema);
            } catch (err) {
                console.error("Invalid custom schema:", err);
                setResult("Invalid custom schema.");
                stopStopwatch();
                setLoading(false);
                return;
            }
        }

        try {
            const request: ChatCompletionRequest = {
                stream: false,
                messages: [
                    {
                        role: "user",
                        content: `Generate a JSON from the following text:\n\n${text}`
                    },
                ],
                max_tokens: 256,
                response_format: {
                    type: "json_object",
                    schema: JSON.stringify(jsonSchema),
                } as ResponseFormat,
            };

            await engineState.chat.completions.create(request);
            const reply = await engineState.getMessage();
            setResult(reply);
        } catch (err) {
            setResult("Error parsing document.");
            console.error(err);
        } finally {
            stopStopwatch();
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
            <h2>PDF to Structured JSON Parser</h2>

            {!gpuSupported && (
                <p style={{ color: 'red' }}>
                    ❌ Your browser does not support <strong>WebGPU</strong>, which is required to run this app.
                    <br />
                    Please try a recent version of Chrome or Edge.
                </p>
            )}

            {gpuSupported && !engineState && (
                <div>
                    <p>Loading LLM engine...</p>
                    <div>
                        {loadingProgress}
                    </div>
                </div>
            )}

            {gpuSupported && engineState && (
                <>
                    <p>
                        ✅ Engine ready! Model: <strong>{selectedModel}</strong>
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                        <label><strong>Choose Schema:</strong></label>
                        <select value={schemaType} onChange={(e) => setSchemaType(e.target.value as any)}>
                            <option value="account">Example Account Schema</option>
                            <option value="custom">Custom Schema</option>
                        </select>
                    </div>

                    {schemaType === 'custom' && (
                        <textarea
                            placeholder="Paste your Zod schema here, e.g. z.object({ name: z.string() })"
                            rows={6}
                            style={{ width: '100%', fontFamily: 'monospace', marginBottom: '1rem' }}
                            value={customSchema}
                            onChange={(e) => setCustomSchema(e.target.value)}
                        />
                    )}

                    <PdfTextExtractor onTextExtracted={callLLM} />
                </>
            )}

            {loading && (
                <p>
                    Parsing content with LLM... ⏱️ {elapsedTime}s
                </p>
            )}
            {result && (
                <>
                    <p>Elapsed time {elapsedTime}</p>
                    <pre
                        style={{
                            whiteSpace: "pre-wrap",
                            marginTop: "1rem",
                            padding: "1rem",
                            background: "#111",
                            color: "#0f0",
                            borderRadius: "8px",
                        }}
                    >
                        {result}
                    </pre>
                </>
            )}
        </div>
    );
}

export default App;
