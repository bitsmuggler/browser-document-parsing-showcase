import { useState } from 'react';
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PdfTextExtractor({onTextExtracted} : {onTextExtracted: (text: string) => void}) {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map((item: any) => item.str).join(' ');
            fullText += `Page ${i}:\n${strings}\n\n`;
        }

        setText(fullText);
        setLoading(false);
        onTextExtracted(fullText); // Call the callback with the extracted text
    };

    return (
        <div className="p-4">
            <h2>PDF Text Extractor</h2>
            <input type="file" accept="application/pdf" onChange={handleFile} />
            {loading && <p>Loading PDF…</p>}
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: '1em' }}>{text}</pre>
        </div>
    );
}
