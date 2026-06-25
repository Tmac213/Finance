import React, { useEffect, useState } from "react";

import {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    listenTransactions
} from "../firebase/firestoreNative";

export default function NativeTest() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [newTitle, setNewTitle] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 5) Use listener in your screen (same pattern)
        // "Unsubscribe is important"
        let unsubscribe: (() => void) | undefined;

        try {
            console.log("[NativeTest] Setting up Firestore listener...");
            unsubscribe = listenTransactions((list) => {
                console.log("[NativeTest] Real-time update:", list);
                setTransactions(list);
                setLoading(false);
            });
        } catch (e: any) {
            console.error("[NativeTest] Listener setup failed:", e);
            setError(e.message || "Failed to set up listener");
            setLoading(false);
        }

        return () => {
            if (unsubscribe) {
                console.log("[NativeTest] Unsubscribing from Firestore listener");
                unsubscribe();
            }
        };
    }, []);

    const handleAdd = async () => {
        if (!newTitle || !newAmount) return;
        try {
            await addTransaction({
                description: newTitle, // Dexie schema uses 'description' not 'title'
                amount: Number(newAmount),
                date: new Date().toISOString(),
                type: 'expense', // default
                category: 'other' // default category
            });
            setNewTitle("");
            setNewAmount("");
        } catch (e: any) {
            console.error("Add failed", e);
            alert("Add failed: " + e.message);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTransaction(id);
        } catch (e: any) {
            console.error("Delete failed", e);
            alert("Delete failed: " + e.message);
        }
    };

    if (loading) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold">Native Firebase Test (Path B Adapter)</h1>
                <p className="mt-4">Loading Firestore listener...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold text-red-600">Error</h1>
                <p className="mt-4 text-red-500">{error}</p>
                <p className="mt-2 text-sm text-gray-600">Check the console for more details.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold">Native Firebase Test (Path B Adapter)</h1>
            <p className="text-sm text-gray-600">Testing direct Firestore listeners (Web SDK adapter)</p>

            <div className="flex gap-2 p-4 border rounded bg-gray-50 dark:bg-gray-800">
                <input
                    className="p-2 border rounded"
                    placeholder="Title"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                />
                <input
                    className="p-2 border rounded"
                    placeholder="Amount"
                    type="number"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                />
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={handleAdd}
                >
                    Add
                </button>
            </div>

            <div className="space-y-2">
                <h2 className="font-semibold">Transactions ({transactions.length})</h2>
                {transactions.length === 0 && (
                    <p className="text-gray-500 italic">No transactions yet. Add one above!</p>
                )}
                {transactions.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                        <span>{item.description || item.title || "No Description"} - ${item.amount}</span>
                        <button
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(item.id)}
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
