// import React, { useState, useRef, useEffect } from 'react';
// import { Send, FileText, Trash2, Bot, User, StopCircle } from 'lucide-react';
// import { Message, Sender, PdfDocument } from '../types';
// import { sendMessageToGemini } from '../services/geminiService';
// import PdfViewer from './PdfViewer';

// interface ChatInterfaceProps {
//   document: PdfDocument;
//   onClear: () => void;
// }

// const ChatInterface: React.FC<ChatInterfaceProps> = ({ document, onClear }) => {
//   const [messages, setMessages] = useState<Message[]>([
//     {
//       id: 'welcome',
//       text: `I have analyzed **${document.name}** (${document.pageCount} pages). \n\nI am ready to answer your questions with strict adherence to the document's content. I will provide page citations for all information extracted.`,
//       sender: Sender.Bot,
//       timestamp: new Date()
//     }
//   ]);
//   const [input, setInput] = useState('');
//   const [isTyping, setIsTyping] = useState(false);

//   // PDF Viewer State
//   const [showPdf, setShowPdf] = useState(false);
//   const [activePage, setActivePage] = useState<number>(1);
//   const [highlightQuote, setHighlightQuote] = useState<string | undefined>(undefined);

//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages, isTyping]);

//   const handleSend = async () => {
//     if (!input.trim() || isTyping) return;

//     const userMessage: Message = {
//       id: Date.now().toString(),
//       text: input,
//       sender: Sender.User,
//       timestamp: new Date()
//     };

//     setMessages(prev => [...prev, userMessage]);
//     setInput('');
//     setIsTyping(true);

//     try {
//       const responseText = await sendMessageToGemini(userMessage.text);
//       const botMessage: Message = {
//         id: (Date.now() + 1).toString(),
//         text: responseText,
//         sender: Sender.Bot,
//         timestamp: new Date()
//       };
//       setMessages(prev => [...prev, botMessage]);
//     } catch (error) {
//       const errorMessage: Message = {
//         id: (Date.now() + 1).toString(),
//         text: "System Error: Unable to process request. Please try again.",
//         sender: Sender.Bot,
//         timestamp: new Date(),
//         isError: true
//       };
//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       setIsTyping(false);
//     }
//   };

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   const handleCitationClick = (pageNum: number, quote?: string) => {
//     // console.log(document.pageMap)
//     const physicalPage = (document.pageMap && document.pageMap[pageNum])
//       ? document.pageMap[pageNum]
//       : pageNum;

//     setActivePage(physicalPage);
//     setHighlightQuote(quote);
//     setShowPdf(true);
//   };



//   // Parser for Markdown-like bold text and custom citations
//   // const renderText = (text: string) => {
//   //   // 1. Split by bold markers (**text**)
//   //   const parts = text.split(/(\*\*.*?\*\*)/g);

//   //   return parts.map((part, index) => {
//   //     // Handle Bold text
//   //     if (part.startsWith('**') && part.endsWith('**')) {
//   //       return <strong key={index}>{part.slice(2, -2)}</strong>;
//   //     }

//   //     // 2. Handle Citations inside regular text
//   //     // Matches [Page X] or [Page X, Quote: "stuff"]
//   //     const citationRegex = /(\[Page\s+\d+[^\]]*\])/g;
//   //     const subParts = part.split(citationRegex);

//   //     return (
//   //       <React.Fragment key={index}>
//   //         {subParts.map((subPart, subIndex) => {
//   //           if (subPart.startsWith('[Page')) {
//   //               // Extract page number and quote
//   //               const pageMatch = subPart.match(/Page\s+(\d+)/);
//   //               const pageNum = pageMatch ? parseInt(pageMatch[1], 10) : 1;

//   //               // Extract quote if present, handling smart quotes or standard quotes
//   //               const quoteMatch = subPart.match(/Quote:\s*["“]([^"”]+)["”]/i);
//   //               const quote = quoteMatch ? quoteMatch[1] : undefined;

//   //               return (
//   //                   <button
//   //                       key={`${index}-${subIndex}`}
//   //                       onClick={() => handleCitationClick(pageNum, quote)}
//   //                       className="inline-flex items-center text-blue-600 font-bold hover:underline hover:text-blue-800 transition-colors mx-1 cursor-pointer bg-blue-50 px-1 rounded text-xs align-middle"
//   //                       title={quote ? `Open Page ${pageNum} and highlight: "${quote}"` : `Open Page ${pageNum}`}
//   //                   >
//   //                       {quote ? `[Page ${pageNum}]` : subPart}
//   //                   </button>
//   //               );
//   //           }
//   //           return subPart;
//   //         })}
//   //       </React.Fragment>
//   //     );
//   //   });
//   // };
//   const renderText = (text: string) => {
//     const parts = text.split(/(\*\*.*?\*\*)/g);

//     return parts.map((part, index) => {
//       if (part.startsWith('**') && part.endsWith('**')) {
//         return <strong key={index}>{part.slice(2, -2)}</strong>;
//       }

//       // UPDATED REGEX: Catches [Page 5], [INTERNAL_PAGE_5], or [Source: Page 5]
//       const citationRegex = /(\[(?:INTERNAL_)?PAGE\s+\d+[^\]]*\])/gi;
//       const subParts = part.split(citationRegex);

//       return (
//         <React.Fragment key={index}>
//           {subParts.map((subPart, subIndex) => {
//             if (/\[(?:INTERNAL_)?PAGE/i.test(subPart)) {
//               const pageMatch = subPart.match(/\d+/); // Just get the first number found
//               const pageNum = pageMatch ? parseInt(pageMatch[0], 10) : 1;

//               const quoteMatch = subPart.match(/Quote:\s*["“]([^"”]+)["”]/i);
//               const quote = quoteMatch ? quoteMatch[1] : undefined;

//               return (
//                 <button
//                   key={`${index}-${subIndex}`}
//                   onClick={() => handleCitationClick(pageNum, quote)}
//                   className="inline-flex items-center text-blue-600 font-bold hover:underline hover:text-blue-800 transition-colors mx-1 cursor-pointer bg-blue-50 px-1 rounded text-xs align-middle"
//                 >
//                   {`[Page ${pageNum}]`}
//                 </button>
//               );
//             }
//             return subPart;
//           })}
//         </React.Fragment>
//       );
//     });
//   };

//   return (
//     <div className="flex h-[85vh] w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">

//       {/* Left Side: Chat */}
//       <div className={`flex flex-col h-full transition-all duration-300 ease-in-out ${showPdf ? 'w-1/2 border-r border-slate-200' : 'w-full'}`}>
//         {/* Chat Header */}
//         <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0">
//           <div className="flex items-center space-x-3">
//             <div className="p-2 bg-indigo-100 rounded-lg">
//               <FileText className="w-5 h-5 text-indigo-600" />
//             </div>
//             <div>
//               <h2 className="font-semibold text-slate-800 truncate max-w-[150px] md:max-w-xs" title={document.name}>{document.name}</h2>
//               <p className="text-xs text-slate-500">{document.pageCount} pages • Compliance Mode</p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             {!showPdf && (
//               <button
//                 onClick={() => setShowPdf(true)}
//                 className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
//                 title="Show Document"
//               >
//                 <FileText className="w-5 h-5" />
//               </button>
//             )}
//             <button
//               onClick={onClear}
//               className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//               title="Close File"
//             >
//               <Trash2 className="w-5 h-5" />
//             </button>
//           </div>
//         </div>

//         {/* Messages */}
//         <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
//           {messages.map((msg) => (
//             <div
//               key={msg.id}
//               className={`flex w-full ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'}`}
//             >
//               <div className={`flex max-w-[90%] ${msg.sender === Sender.User ? 'flex-row-reverse' : 'flex-row'}`}>

//                 <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 
//                     ${msg.sender === Sender.User ? 'bg-indigo-600 ml-3' : 'bg-emerald-700 mr-3'}`}>
//                   {msg.sender === Sender.User ? (
//                     <User className="w-5 h-5 text-white" />
//                   ) : (
//                     <Bot className="w-5 h-5 text-white" />
//                   )}
//                 </div>

//                 <div
//                   className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm
//                       ${msg.sender === Sender.User
//                       ? 'bg-indigo-600 text-white rounded-tr-none'
//                       : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
//                     }
//                       ${msg.isError ? 'bg-red-50 border-red-200 text-red-600' : ''}
//                     `}
//                 >
//                   <div className="whitespace-pre-wrap">{renderText(msg.text)}</div>
//                 </div>

//               </div>
//             </div>
//           ))}

//           {isTyping && (
//             <div className="flex w-full justify-start">
//               <div className="flex flex-row items-center">
//                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center mr-3">
//                   <Bot className="w-5 h-5 text-white" />
//                 </div>
//                 <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1">
//                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
//                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
//                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
//                 </div>
//               </div>
//             </div>
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input */}
//         <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
//           <div className="relative flex items-center">
//             <textarea
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={handleKeyDown}
//               placeholder="Ask a regulatory question..."
//               className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none text-slate-800 placeholder-slate-400"
//               rows={1}
//               style={{ minHeight: '50px', maxHeight: '120px' }}
//             />
//             <button
//               onClick={handleSend}
//               disabled={!input.trim() || isTyping}
//               className={`absolute right-2 p-2 rounded-lg transition-all duration-200
//                   ${input.trim() && !isTyping
//                   ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
//                   : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
//                 `}
//             >
//               {isTyping ? <StopCircle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
//             </button>
//           </div>
//           <p className="text-center text-[10px] text-slate-400 mt-2">
//             Click citations (e.g., [Page 5]) to verify source.
//           </p>
//         </div>
//       </div>

//       {/* Right Side: PDF Viewer */}
//       {showPdf && (
//         <div className="w-1/2 h-full border-l border-slate-200 animate-fade-in">
//           <PdfViewer
//             url={document.fileUrl}
//             // pageNumber={activePage}
//             highlightText={highlightQuote}
//             onClose={() => setShowPdf(false)}
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default ChatInterface;



import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, FileText, Trash2, Bot, User, Mic, MicOff, Loader2, StopCircle, Waves } from 'lucide-react';
import { Message, Sender, PdfDocument, SessionStatus } from '../types';
import {
  initGeminiLive,
  decodeAudio,
  decodeAudioData,
  createPcmBlob,
  sendMessageToGemini
} from '../services/geminiService';
import PdfViewer from './PdfViewer';

interface ChatInterfaceProps {
  document: PdfDocument;
  onClear: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ document, onClear }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: `Protocol established for **${document.name}**. Scientific Regulatory Assistant active. I will strictly cite evidence from the document.`,
      sender: Sender.Bot,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [highlightQuote, setHighlightQuote] = useState<string | undefined>(undefined);

  // Voice Session State
  const [voiceStatus, setVoiceStatus] = useState<SessionStatus>(SessionStatus.IDLE);
  const [currentVoiceUserText, setCurrentVoiceUserText] = useState('');
  const [currentVoiceModelText, setCurrentVoiceModelText] = useState('');

  // Voice Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time transcription refs
  const vUserRef = useRef('');
  const vBotRef = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, currentVoiceUserText, currentVoiceModelText]);

  const handleCitationClick = (pageNum: number, quote?: string) => {
    setHighlightQuote(quote);
    setShowPdf(true);
  };

  const handleSendText = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: `text-user-${Date.now()}`,
      text: input,
      sender: Sender.User,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const aiResponse = await sendMessageToGemini(currentInput);

      const botMsg: Message = {
        id: `text-bot-${Date.now()}`,
        text: aiResponse,
        sender: Sender.Bot,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg: Message = {
        id: `text-error-${Date.now()}`,
        text: "I encountered an error. Please ensure the scientific engine is primed.",
        sender: Sender.Bot,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleStopVoice = useCallback(() => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) { }
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) { }
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      try { outputAudioContextRef.current.close(); } catch (e) { }
      outputAudioContextRef.current = null;
    }

    for (const source of sourcesRef.current) {
      try { source.stop(); } catch (e) { }
    }
    sourcesRef.current.clear();

    setVoiceStatus(SessionStatus.IDLE);
    setCurrentVoiceUserText('');
    setCurrentVoiceModelText('');
    vUserRef.current = '';
    vBotRef.current = '';
  }, []);

  const handleStartVoice = async () => {
    try {
      setVoiceStatus(SessionStatus.CONNECTING);

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      await inputCtx.resume();
      await outputCtx.resume();

      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = initGeminiLive(document.text, {
        onOpen: () => {
          setVoiceStatus(SessionStatus.ACTIVE);

          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);

          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createPcmBlob(inputData);

            sessionPromise.then((session) => {
              if (session) session.sendRealtimeInput({ media: pcmBlob });
            }).catch(() => { });
          };

          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
        },
        onMessage: async (message) => {
          // Fixed optional chaining
          const audioBase64 = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioBase64 && outputAudioContextRef.current) {
            const ctx = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const buffer = await decodeAudioData(decodeAudio(audioBase64), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => sourcesRef.current.delete(source);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            // Fixed: accessing current property of sourcesRef
            sourcesRef.current.add(source);
          }

          if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            vUserRef.current += text;
            setCurrentVoiceUserText(prev => prev + text);
          }
          if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            vBotRef.current += text;
            setCurrentVoiceModelText(prev => prev + text);
          }

          if (message.serverContent?.turnComplete) {
            const finalizedUser = vUserRef.current.trim();
            const finalizedBot = vBotRef.current.trim();

            if (finalizedUser) {
              setMessages(prev => [...prev, {
                id: `v-user-${Date.now()}`,
                sender: Sender.User,
                text: finalizedUser,
                timestamp: new Date()
              }]);
            }

            if (finalizedBot) {
              setMessages(prev => [...prev, {
                id: `v-bot-${Date.now()}`,
                sender: Sender.Bot,
                text: finalizedBot,
                timestamp: new Date()
              }]);
            }

            vUserRef.current = '';
            vBotRef.current = '';
            setCurrentVoiceUserText('');
            setCurrentVoiceModelText('');
          }

          if (message.serverContent?.interrupted) {
            for (const source of sourcesRef.current) { try { source.stop(); } catch (e) { } }
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onError: (e) => {
          console.error("Voice Session Error Hook:", e);
          setVoiceStatus(SessionStatus.ERROR);
        },
        onClose: () => handleStopVoice()
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Microphone Access or Connection Failure", err);
      setVoiceStatus(SessionStatus.ERROR);
      handleStopVoice();
    }
  };

  const BOLD_REGEX = /(\*\*.*?\*\*)/g;
  const CITATION_REGEX = /\[(?:INTERNAL_)?PAGE[_\s]?(\d+)[^\]]*\]/gi;
  const QUOTE_REGEX = /Quote:\s*["“]([^"”]+)["”]/i;

  const renderText = (text: string) => {
    if (!text) return null;

    // Split into paragraphs
    const paragraphs = text.split(/\n+/);

    return paragraphs.map((paragraph, pIndex) => {
      const boldSegments = paragraph.split(BOLD_REGEX);

      return (
        <p key={`paragraph-${pIndex}`} className="mb-3 leading-relaxed">
          {boldSegments.map((segment, boldIndex) => {
            // Handle markdown bold
            if (segment.startsWith("**") && segment.endsWith("**")) {
              return (
                <strong key={`bold-${pIndex}-${boldIndex}`}>
                  {segment.slice(2, -2)}
                </strong>
              );
            }

            const elements: React.ReactNode[] = [];
            let cursor = 0;

            for (const match of segment.matchAll(CITATION_REGEX)) {
              const fullMatch = match[0];
              const pageNum = Number(match[1]) || 1;
              const matchIndex = match.index ?? 0;

              if (matchIndex > cursor) {
                elements.push(segment.slice(cursor, matchIndex));
              }

              const quoteMatch = fullMatch.match(QUOTE_REGEX);
              const quote = quoteMatch?.[1];

              elements.push(
                <button
                  key={`citation-${pIndex}-${boldIndex}-${matchIndex}`}
                  type="button"
                  onClick={() => handleCitationClick(pageNum, quote)}
                  className="inline-flex items-center text-indigo-600 font-bold hover:underline hover:text-indigo-800 transition-colors mx-1 cursor-pointer bg-indigo-50 px-1.5 py-0.5 rounded text-xs align-middle border border-indigo-100 shadow-sm"
                  title={
                    quote
                      ? `Highlight: "${quote}"`
                      : `Go to page ${pageNum}`
                  }
                >
                  {`[Page ${pageNum}]`}
                </button>
              );

              cursor = matchIndex + fullMatch.length;
            }

            if (cursor < segment.length) {
              elements.push(segment.slice(cursor));
            }

            return elements;
          })}
        </p>
      );
    });
  };


  return (
    <div className="flex h-[85vh] w-full max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 ring-1 ring-slate-100">

      <div className={`flex flex-col h-full transition-all duration-500 ease-in-out ${showPdf ? 'w-1/2 border-r border-slate-200' : 'w-full'}`}>

        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-slate-100 flex-shrink-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 rounded-2xl">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 truncate max-w-[150px] md:max-w-xs">{document.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  {document.pageCount} Pages
                </span>
                {voiceStatus === SessionStatus.ACTIVE && (
                  <span className="flex items-center gap-1.5 text-[10px] text-green-600 font-black uppercase">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                    Live Interaction
                  </span>
                )}
                {voiceStatus === SessionStatus.ERROR && (
                  <span className="text-[10px] text-red-500 font-black uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    Connection Error
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!showPdf && (
              <button
                onClick={() => setShowPdf(true)}
                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Open PDF Preview"
              >
                <FileText className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClear}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Close and Clear"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/20 scroll-smooth">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] ${msg.sender === Sender.User ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                <div className={`flex-shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg
                    ${msg.sender === Sender.User ? (msg.isError ? 'bg-red-600' : 'bg-indigo-600') + ' ml-3' : 'bg-emerald-700 mr-3'}`}>
                  {msg.sender === Sender.User ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                      ${msg.sender === Sender.User
                    ? (msg.isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-indigo-600 text-white') + ' rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }
                    `}
                >
                  <div className="whitespace-pre-wrap">{renderText(msg.text)}</div>
                  <div className={`text-[10px] mt-2 opacity-50 ${msg.sender === Sender.User ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {(currentVoiceUserText || currentVoiceModelText) && (
            <div className="space-y-4 pt-2">
              {currentVoiceUserText && (
                <div className="flex w-full justify-end">
                  <div className="flex flex-row-reverse items-start max-w-[85%]">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-200 flex items-center justify-center ml-3 animate-pulse">
                      <User className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 p-4 rounded-2xl rounded-tr-none text-sm italic border border-indigo-100 shadow-sm">
                      {renderText(currentVoiceUserText)}
                    </div>
                  </div>
                </div>
              )}
              {currentVoiceModelText && (
                <div className="flex w-full justify-start">
                  <div className="flex items-start max-w-[85%]">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center mr-3 animate-pulse">
                      <Bot className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="bg-white border border-slate-100 text-slate-500 p-4 rounded-2xl rounded-tl-none text-sm italic shadow-sm">
                      {renderText(currentVoiceModelText)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {isTyping && (
            <div className="flex w-full justify-start items-center space-x-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-emerald-700 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-10" />
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex-shrink-0 relative">
          <div className="flex flex-col gap-4">

            <div className="flex justify-center -mt-12 mb-2 relative z-20">
              {voiceStatus === SessionStatus.IDLE || voiceStatus === SessionStatus.ERROR ? (
                <button
                  onClick={handleStartVoice}
                  className="group flex items-center gap-3 px-8 py-3.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full transition-all font-black text-sm shadow-xl shadow-indigo-200 border-4 border-white active:scale-95"
                >
                  <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {voiceStatus === SessionStatus.ERROR ? 'RETRY VOICE SESSION' : 'START VOICE SESSION'}
                </button>
              ) : voiceStatus === SessionStatus.CONNECTING ? (
                <button disabled className="flex items-center gap-3 px-8 py-3.5 bg-slate-200 text-slate-500 rounded-full font-black text-sm border-4 border-white">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  ESTABLISHING LINK...
                </button>
              ) : (
                <button
                  onClick={handleStopVoice}
                  className="group flex items-center gap-3 px-8 py-3.5 bg-red-500 text-white hover:bg-red-600 rounded-full transition-all font-black text-sm shadow-xl shadow-red-200 border-4 border-white active:scale-95"
                >
                  <StopCircle className="w-5 h-5" />
                  END VOICE SESSION
                </button>
              )}
            </div>

            <div className="relative flex items-center gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } }}
                placeholder={voiceStatus === SessionStatus.ACTIVE ? "Voice session active • Speak now..." : "Inquire about scientific evidence..."}
                disabled={voiceStatus === SessionStatus.ACTIVE || isTyping}
                className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 resize-none text-slate-800 placeholder-slate-400 disabled:opacity-40 transition-all font-medium"
                rows={1}
                style={{ minHeight: '56px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSendText}
                disabled={!input.trim() || isTyping || voiceStatus === SessionStatus.ACTIVE}
                className={`absolute right-2 p-3 rounded-xl transition-all duration-300
                    ${input.trim() && !isTyping && voiceStatus !== SessionStatus.ACTIVE
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg translate-x-0'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'}
                  `}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {voiceStatus === SessionStatus.ACTIVE && (
              <div className="flex justify-center items-center gap-1.5 text-indigo-500 animate-pulse">
                <Waves className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Mic is hot • Ask anything</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPdf && (
        <div className="w-1/2 h-full border-l border-slate-100 bg-white animate-in slide-in-from-right duration-500 relative">
          <PdfViewer
            url={document.fileUrl}
            highlightText={highlightQuote}
            onClose={() => {
              setShowPdf(false);
              setHighlightQuote(undefined);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
