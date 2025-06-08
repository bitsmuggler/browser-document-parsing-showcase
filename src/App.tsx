import { useEffect, useRef, useState } from "react";
import { CreateMLCEngine, type MLCEngineInterface } from "@mlc-ai/web-llm";
import PdfTextExtractor from "./PdfExtractor.tsx";

const selectedModel = "Phi-3.5-mini-instruct-q4f16_1-MLC";

let engine: MLCEngineInterface | null = null;

const initProgressCallback = (progress: number) => {
    console.log("Model loading progress:", progress);
};

async function initEngine() {
    if (!engine) {
        engine = await CreateMLCEngine(selectedModel, {
            initProgressCallback,
            logLevel: "INFO",
        });

        // Warm up the model
        await engine.chat.completions.create({
            messages: [{ role: "user", content: "Ready?" }],
        });
    }
    return engine;
}

function App() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [engineReady, setEngineReady] = useState(false);
    const intervalRef = useRef<number | null>(null);

    // Init engine on app load
    useEffect(() => {
        initEngine()
            .then(() => setEngineReady(true))
            .catch((err) => {
                console.error("Failed to init engine:", err);
                setEngineReady(false);
            });
    }, []);

    const startStopwatch = () => {
        const start = performance.now();
        intervalRef.current = window.setInterval(() => {
            const now = performance.now();
            setElapsedTime(((now - start) / 1000).toFixed(1));
        }, 100);
    };

    const stopStopwatch = () => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
        }
    };

    const callLLM = async (text: string) => {
        if (!engineReady) {
            setResult("Engine not ready yet. Please wait a moment.");
            return;
        }

        setLoading(true);
        setElapsedTime(0);
        setResult(null);
        startStopwatch();

        try {
            const messages = [
                {
                    role: "system",
                    content: `You are a JSON transformer. Only return valid JSON.`,
                },
                { role: "user", content: text },
            ];

            const reply = await engine!.chat.completions.create({ messages });
            const parsed = reply.choices[0].message.content;
            setResult(parsed);
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
            {!engineReady && <p>Loading LLM engine...</p>}
            <PdfTextExtractor onTextExtracted={callLLM} />
            {loading && (
                <p>
                    Parsing content with LLM... ⏱️ {elapsedTime}s
                </p>
            )}
            {result && (
                <pre
                    style={{
                        whiteSpace: "pre-wrap",
                        marginTop: "1rem",
                        padding: "1rem",
                    }}
                >
                    {result}
                </pre>
            )}
        </div>
    );
}

export default App;
