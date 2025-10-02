// File: src/FileProcessor.js
import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { csvPreviewAndStats } from "./utils/dataAnalysis"; // Assuming utils are correctly imported

/**
 * Custom hook to handle file selection, parsing, and state management for data.
 */
export const useFileProcessor = () => {
    const [fileContent, setFileContent] = useState("");
    const [rawMeta, setRawMeta] = useState(null);
    const [rows, setRows] = useState([]);

    const [showModal, setShowModal] = useState(false); 
    const [modalMessage, setModalMessage] = useState("");

    // The handler now accepts an object 'e' which might contain the fileObject 
    // from App.jsx's simplified file handler, or the original target files.
    const handleFileChange = useCallback((e) => {
        // Retrieve the file object from either the custom property or the native input target
        const file = e.fileObject || e.target.files?.[0];
        if (!file) return;
        const name = file.name.toLowerCase();

        // ADDED fileObject parameter to save the original File object
        const setAll = (fileObject, preview, stats, parsedRows) => {
            setFileContent(preview);
            setRawMeta({ filename: fileObject.name, stats, fileObject }); // <-- FIX: Storing fileObject
            setRows(parsedRows);
        };

        // CSV/TXT Parser
        if (name.endsWith(".csv") || name.endsWith(".txt")) {
            const reader = new FileReader();
            reader.onload = () => {
                const csvText = String(reader.result || "");
                const { preview, stats } = csvPreviewAndStats(csvText);
                const condensed =
                    `# File: ${file.name}\n# Stats: ${stats}\n\n${preview}`.slice(
                        0,
                        60000
                    );
                // Simplified CSV parsing for the code example
                const headers = preview.split(/\r?\n/)[0].split(",");
                const data = preview.split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
                    const cells = [];
                    let cur = "", inQ = false;
                    for (let i = 0; i < line.length; i++) {
                        const c = line[i];
                        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
                        if (c === '"') { inQ = !inQ; continue; }
                        if (c === "," && !inQ) { cells.push(cur); cur = ""; continue; }
                        cur += c;
                    }
                    cells.push(cur);
                    const obj = {};
                    headers.forEach((h, i) => (obj[h.trim?.() ? h.trim() : h] = cells[i] ?? ""));
                    return obj;
                });
                setAll(file, condensed, stats, data); // Passing 'file' object
            };
            reader.readAsText(file);
        // XLSX/XLS Parser
        } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
            const reader = new FileReader();
            reader.onload = () => {
                const data = new Uint8Array(reader.result);
                const wb = XLSX.read(data, { type: "array" });
                const sheet = wb.SheetNames[0];
                const ws = wb.Sheets[sheet];
                const csv = XLSX.utils.sheet_to_csv(ws);
                const { preview, stats } = csvPreviewAndStats(csv);
                const condensed =
                    `# File: ${file.name}\n# Sheet: ${sheet}\n# Stats: ${stats}\n\n${preview}`.slice(
                        0,
                        60000
                    );
                const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
                setAll(file, condensed, `Sheet=${sheet}; ${stats}`, json); // Passing 'file' object
            };
            reader.readAsArrayBuffer(file);
        // JSON Parser
        } else if (name.endsWith(".json")) {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const text = String(reader.result || "");
                    const obj = JSON.parse(text);
                    const arr = Array.isArray(obj)
                        ? obj
                        : Array.isArray(obj?.data)
                            ? obj.data
                            : [];
                    const headers = arr.length ? Object.keys(arr[0]) : [];
                    const preview = `# File: ${file.name}\n# Keys: ${headers.join(
                        ", "
                    )}\n\n${text.slice(0, 5000)}`;
                    setAll(file, preview, `JSON length: ${text.length}`, arr); // Passing 'file' object
                } catch {
                    setModalMessage("JSON is invalid or not an array.");
                    setShowModal(true);
                }
            };
            reader.readAsText(file);
        } else {
            setModalMessage(
                "Unsupported file type. Please upload CSV, XLSX/XLS, TXT, or JSON."
            );
            setShowModal(true);
        }
    }, [setShowModal, setModalMessage]); 

    return {
        fileContent,
        rawMeta,
        rows,
        handleFileChange,
        setFileProcessorModalMessage: setModalMessage,
        setFileProcessorShowModal: setShowModal,
    };
};