import React, { useState } from 'react';
import { getGeminiResponse } from '../services/geminiService';
import { Send, Bot } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    isBot: boolean;
}

export const Assistant: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: '¡Hola! Soy tu asistente navideño. ¿Qué tipo de filtro o experiencia buscas hoy?', isBot: true }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!input.trim()) return;

        const userMsg = { id: Date.now().toString(), text: input, isBot: false };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        const response = await getGeminiResponse(input);
        
        const botMsg = { id: (Date.now() + 1).toString(), text: response || 'Hubo un error.', isBot: true };
        setMessages(prev => [...prev, botMsg]);
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-180px)]">
            {/* Normalized Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white font-display mb-4 flex items-center justify-center gap-2 drop-shadow-md">
                <Bot /> Asistente AI
            </h1>
            
            <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 p-4 overflow-y-auto space-y-4 no-scrollbar">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                            msg.isBot 
                            ? 'bg-gray-800 text-gray-200 rounded-tl-none' 
                            : 'bg-navifest-red text-white rounded-tr-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 p-3 rounded-lg text-xs text-gray-400 animate-pulse">
                            Escribiendo...
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="mt-4 flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Pregúntame sobre Navidad..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-white focus:outline-none focus:border-navifest-gold"
                />
                <button type="submit" disabled={loading} className="bg-navifest-green p-2 rounded-full text-white hover:bg-green-700 transition disabled:opacity-50">
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};