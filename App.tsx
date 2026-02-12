import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import { PdfDocument } from './types';
import { extractTextFromPdf } from './services/pdfService';
import { initializeChat } from './services/geminiService';
import { Sparkles, Github } from 'lucide-react';

const App: React.FC = () => {
  const [currentDocument, setCurrentDocument] = useState<PdfDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      // console.log("Extraction successful, initializing chat...");
      const pdfDoc = await extractTextFromPdf(file);
      
      initializeChat(pdfDoc.text);
      setCurrentDocument(pdfDoc);
    } catch (error) {
      console.error("Failed to process PDF", error);
      alert("Failed to process the PDF. Please try a different file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearDocument = () => {
    setCurrentDocument(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Altius
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {/* <span className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                Professional Mode
              </span> */}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {!currentDocument ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 animate-fade-in-up">
            <div className="text-center max-w-4xl mx-auto space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                {/* Precision Analysis for <span className="text-indigo-600">Pharma</span> */}
                <span className="text-indigo-600">Precision</span> Knowledge Retrieval Engine
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                Securely upload technical documentation. Get evidence-based answers with page citations and zero hallucination.
              </p>
            </div>
            
            <div className="w-full">
               <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <ChatInterface document={currentDocument} onClear={clearDocument} />
          </div>
        )}
      </main>
      
      {/* Footer */}
      {!currentDocument && (
        <footer className="py-6 text-center text-sm text-slate-400">
            <p>© {new Date().getFullYear()} Powered by Altius AI.</p>
        </footer>
      )}
    </div>
  );
};

export default App;

