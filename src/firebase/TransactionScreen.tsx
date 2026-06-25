import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native"; // or web elements if React DOM
import { listenTransactions } from "../firebase/firestore"; // adjust path if needed
import { addTransaction, updateTransaction } from "../firebase/firestore";

// To add:
await addTransaction({ title, amount, type, createdAt: new Date(), userId: 'USER_UID' });

// To edit:
await updateTransaction(transactionId, { title: 'new', amount: 120 });



export default function TransactionScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = listenTransactions((list) => {
      setTransactions(list);
    });

    return () => unsubscribe(); // important to stop listening
  }, []);

  return (
    <View>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text>{item.title} — {item.amount} — {item.type}</Text>
        )}
      />
    </View>
  );
}
