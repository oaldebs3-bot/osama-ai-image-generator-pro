
import React, { useState, useCallback, useRef } from 'react';
import { generateImage, editImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { SparklesIcon, PhotoIcon, ArrowDownTrayIcon, PencilSquareIcon, XCircleIcon, UploadIcon } from './components/icons';
import type { AspectRatio } from './types';

type Mode = 'generate' | 'edit';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('generate');
  const [prompt, setPrompt] = useState<string>('');
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalImageForEdit, setOriginalImageForEdit] = useState<{ data: string; mimeType: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearError = () => setError(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt) {
      setError('Please enter a prompt to generate an image.');
      return;
    }
    clearError();
    setIsLoading(true);
    setImageSrc(null);
    setOriginalImageForEdit(null);

    try {
      const base64Image = await generateImage(prompt, aspectRatio);
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;
      setImageSrc(imageUrl);
      setOriginalImageForEdit({ data: base64Image, mimeType: 'image/jpeg' });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred during image generation.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, aspectRatio]);

  const handleEdit = useCallback(async () => {
    if (!editPrompt) {
      setError('Please enter an editing instruction.');
      return;
    }
    if (!originalImageForEdit) {
      setError('No image loaded for editing.');
      return;
    }
    clearError();
    setIsLoading(true);
    
    try {
      const base64Image = await editImage(editPrompt, originalImageForEdit.data, originalImageForEdit.mimeType);
      const imageUrl = `data:image/png;base64,${base64Image}`;
      setImageSrc(imageUrl);
      // Update the original image for subsequent edits
      setOriginalImageForEdit({ data: base64Image, mimeType: 'image/png' });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred during image editing.');
    } finally {
      setIsLoading(false);
    }
  }, [editPrompt, originalImageForEdit]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }
      clearError();
      setIsLoading(true);
      try {
        const { base64, mimeType } = await fileToBase64(file);
        const imageUrl = `data:${mimeType};base64,${base64}`;
        setImageSrc(imageUrl);
        setOriginalImageForEdit({ data: base64, mimeType });
        setMode('edit');
      } catch (e) {
        setError('Failed to load image.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const switchToEditMode = () => {
    if (imageSrc) {
      setMode('edit');
    }
  };
  
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    clearError();
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-100 flex flex-col p-4 md:p-8 font-sans">
      <header className="w-full max-w-6xl mx-auto text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600 flex items-center justify-center gap-3">
          <SparklesIcon className="w-10 h-10" />
          AI Image Studio
        </h1>
        <p className="text-gray-400 mt-2">Generate and edit images with the power of AI.</p>
      </header>
      
      <main className="flex-grow w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Controls Panel */}
        <div className="w-full lg:w-1/3 lg:max-w-md bg-gray-800 rounded-lg p-6 shadow-lg flex flex-col h-full">
          <div className="flex border-b border-gray-700 mb-6">
            <button 
              onClick={() => handleModeChange('generate')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 ${mode === 'generate' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>
              <SparklesIcon className="w-5 h-5" />
              Generate
            </button>
            <button 
              onClick={() => handleModeChange('edit')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 ${mode === 'edit' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>
              <PencilSquareIcon className="w-5 h-5" />
              Edit
            </button>
          </div>
          
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md mb-4 flex justify-between items-center">
              <span className="text-sm">{error}</span>
              <button onClick={clearError} className="text-red-300 hover:text-red-100"><XCircleIcon className="w-5 h-5"/></button>
            </div>
          )}

          {mode === 'generate' && (
            <div className="flex flex-col gap-6">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                <textarea
                  id="prompt"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A majestic lion wearing a crown, studio lighting"
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                <select
                  id="aspectRatio"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                >
                  <option value="1:1">Square (1:1)</option>
                  <option value="16:9">Landscape (16:9)</option>
                  <option value="9:16">Portrait (9:16)</option>
                  <option value="4:3">Standard (4:3)</option>
                  <option value="3:4">Tall (3:4)</option>
                </select>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-all duration-200"
              >
                {isLoading ? 'Generating...' : <> <SparklesIcon className="w-5 h-5" /> Generate Image </> }
              </button>
            </div>
          )}

          {mode === 'edit' && (
            <div className="flex flex-col gap-6 h-full">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <button 
                onClick={triggerFileUpload}
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-colors duration-200"
              >
                <UploadIcon className="w-5 h-5"/>
                {originalImageForEdit ? 'Upload New Image' : 'Upload Image'}
              </button>
              {originalImageForEdit && (
                <>
                  <div className="flex-grow">
                    <label htmlFor="editPrompt" className="block text-sm font-medium text-gray-300 mb-2">Editing Instruction</label>
                    <textarea
                      id="editPrompt"
                      rows={4}
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="e.g., Add a futuristic city in the background"
                      className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                  </div>
                  <button
                    onClick={handleEdit}
                    disabled={isLoading || !originalImageForEdit}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-all duration-200"
                  >
                     {isLoading ? 'Applying Edit...' : <> <PencilSquareIcon className="w-5 h-5" /> Apply Edit </> }
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Image Display */}
        <div className="w-full lg:w-2/3 flex flex-col">
           <div className="flex-grow bg-gray-800 rounded-lg shadow-lg flex items-center justify-center p-4 aspect-square">
            <div className="w-full h-full border-2 border-dashed border-gray-600 rounded-md flex items-center justify-center">
              {isLoading ? (
                <div className="text-center text-gray-400">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
                  <p className="mt-4">AI is thinking...</p>
                </div>
              ) : imageSrc ? (
                <img src={imageSrc} alt={prompt} className="max-w-full max-h-full object-contain rounded-md" />
              ) : (
                <div className="text-center text-gray-500">
                  <PhotoIcon className="w-24 h-24 mx-auto" />
                  <p className="mt-2">Your generated image will appear here</p>
                </div>
              )}
            </div>
          </div>
          {imageSrc && !isLoading && (
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
               <a
                  href={imageSrc}
                  download="ai-generated-image.jpg"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-colors duration-200"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" /> Download
                </a>
              <button
                onClick={switchToEditMode}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-colors duration-200"
                >
                <PencilSquareIcon className="w-5 h-5" /> Edit this Image
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
