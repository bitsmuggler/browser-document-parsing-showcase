import {useEffect, useRef, useState} from "react";
import {CreateWebWorkerMLCEngine, type MLCEngineInterface, prebuiltAppConfig} from "@mlc-ai/web-llm";
import PdfTextExtractor from "./PdfExtractor.tsx";
import { z } from "zod/v4";


const selectedModel = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

let engine: MLCEngineInterface | null = null;

const initProgressCallback = (progress: number) => {
    console.log("Model loading progress:", progress);
};

async function initEngine() {
    const appConfig = prebuiltAppConfig;
    // CHANGE THIS TO SEE EFFECTS OF BOTH, CODE BELOW DO NOT NEED TO CHANGE
    appConfig.useIndexedDBCache = true;

    if (appConfig.useIndexedDBCache) {
        console.log("Using IndexedDB Cache");
    } else {
        console.log("Using Cache API");
    }


    if (!engine) {
        // engine = await CreateMLCEngine(selectedModel, {
        //     initProgressCallback: initProgressCallback as any,
        //     logLevel: "INFO",
        // });


        engine =
            await CreateWebWorkerMLCEngine(
                new Worker(new URL("./worker.ts", import.meta.url), {type: "module"}),
                selectedModel,
                {initProgressCallback: initProgressCallback as any, appConfig},
            );

        // Warm up the model
        const warmUp = await engine.chat.completions.create({
            messages: [
                {role: "system", content: "You are a helpful text to json transformer."},
                {role: "user", content: "Are you ready?"}
            ],
        });

        console.log("Warm-up response:", warmUp.choices[0].message.content);
    }
    return engine;
}

function App() {

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [engine, setEngine] = useState<MLCEngineInterface | null>(null);
    const intervalRef = useRef<number | null>(null);

    const AccountSchema = z.object({
        balance: z.number(),             // Saldo
        account_type: z.string(),        // Kontotyp
        account_currency: z.string(),    // Kontowährung
        interest_rate: z.string(),       // Zinssatz (can be z.number() if it's numeric)
        bank_name: z.string(),           // Bankname
        iban: z.string(),                // IBAN
        bic_swift: z.string()            // BIC/SWIFT
    });

    // Init engine on app load
    useEffect(() => {
        console.log('Initializing engine...');
        initEngine()
            .then((engine) => setEngine(engine))
            .catch((err) => {
                console.error("Failed to init engine:", err);
            });
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
        if (!engine) {
            setResult("Engine not ready yet. Please wait a moment.");
            return;
        }

        setLoading(true);
        setElapsedTime(0);
        setResult(null);
        startStopwatch();

        try {
            // const messages = [
            //     {
            //         role: "system",
            //         content: `You are a Text to JSON transformer. Transform the following text to valid JSON.`,
            //     },
            //     {role: "user", content: text},
            // ];

            const request: webllm.ChatCompletionRequest = {
                stream: false, // works with streaming, logprobs, top_logprobs as well
                messages: [
                    {
                        role: "user",
                        content:
                            `Generate a json from the following text: ${text}`
                    },
                ],
                max_tokens: 128,
                response_format: {
                    type: "json_object",
                    schema: JSON.stringify(z.toJSONSchema(AccountSchema)),
                } as webllm.ResponseFormat,
            };

            const reply0 = await engine.chatCompletion(request);

            console.log('Reply 0', reply0);

           // const reply = await engine!.chat.completions.create(request);
           // const parsed = reply.choices[0].message.content;
            setResult(await engine.getMessage());
        } catch (err) {
            setResult("Error parsing document.");
            console.error(err);
        } finally {
            stopStopwatch();
            setLoading(false);
        }
    };

    return (
        <div style={{padding: "2rem", fontFamily: "sans-serif"}}>
            <h2>PDF to Structured JSON Parser</h2>
            {!engine && <p>Loading LLM engine...</p>}
            {engine && (
                <>
                    <p>
                        Engine ready! Model: <strong>{selectedModel}</strong>
                    </p>
                    <PdfTextExtractor onTextExtracted={callLLM}/>
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
