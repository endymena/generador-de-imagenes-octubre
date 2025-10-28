import React, { useState, useCallback, useRef } from 'react';
import { generateOrEditImage } from './services/geminiService';
import { SparklesIcon, PhotoIcon, ExclamationTriangleIcon, UploadIcon, TrashIcon } from './components/Icons';
import { Spinner } from './components/Spinner';

const App: React.FC = () => {
  const initialPrompt = `A fierce athletic woman adjusting her fingerless training 
gloves [Main Subject], leaning slightly forward with an intense 
gaze into the camera [Pose or Action], inside a dimly lit 
modern boxing gym with red and black punching bags in the 
background [Scene/Environment], photographed from a tight 
waist-up angle for dramatic intensity [Image Angle or 
Perspective], cinematic sportswear portrait style [Image 
Style], wearing a black cropped compression top, matching 
mesh-detailed leggings, and sleek black boxing shoes 
[Adjectives and Physical Details], single overhead spotlight 
creating high contrast with deep shadows on the background 
[Texture and Lighting], black, deep red, and matte steel 
[Specific Colors], inspired by premium fight sports brand 
campaigns [Art Styles and Eras], no blur, no lighting artifacts, 
no facial distortion [Negative Prompts], captured with a Nikon 
Z9 and 50mm f/1.2 S lens [Camera Model and Lens].`;

  const [prompt, setPrompt] = useState<string>(initialPrompt);
  const [uploadedImage, setUploadedImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setError(null);
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            setUploadedImage({
                data: dataUrl.split(',')[1],
                mimeType: file.type,
                preview: dataUrl,
            });
        };
        reader.readAsDataURL(file);
    } else if (file) {
        setError("Please upload a valid image file (e.g., PNG, JPG, WEBP).");
    }
    // Reset file input value to allow re-uploading the same file
    if(event.target) event.target.value = '';
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
  };

  const handleGenerateOrEdit = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const imageToEdit = uploadedImage ? { data: uploadedImage.data, mimeType: uploadedImage.mimeType } : undefined;
      const imageUrl = await generateOrEditImage(prompt, imageToEdit);
      setGeneratedImageUrl(imageUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate content. Please try again. Error: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, uploadedImage]);
  
  const isEditing = !!uploadedImage;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col font-sans p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-6xl mx-auto mb-6">
        <h1 className="text-4xl sm:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
          AI Image Generator
        </h1>
        <p className="text-center text-gray-400 mt-2">
          Craft detailed prompts to generate or edit stunning visuals with Gemini.
        </p>
      </header>

      <main className="flex-grow w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Prompt and Controls */}
        <div className="flex flex-col bg-gray-800/50 rounded-2xl shadow-lg p-6 backdrop-blur-sm border border-gray-700/50">
          
          {/* Image Upload Area */}
          <div className="mb-4">
            <label className="text-lg font-semibold text-gray-300 mb-2 block">
                {isEditing ? 'Source Image' : 'Add an Image to Edit (Optional)'}
            </label>
            {uploadedImage ? (
                <div className="relative group bg-gray-900/50 rounded-lg">
                    <img src={uploadedImage.preview} alt="Upload preview" className="rounded-lg w-full max-h-60 object-contain"/>
                    <button 
                      onClick={removeUploadedImage} 
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-600/80 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="Remove image"
                    >
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
            ) : (
                <div onClick={triggerFileUpload} className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-gray-800/60 transition-all duration-300">
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden"/>
                    <UploadIcon className="w-10 h-10 mx-auto text-gray-500"/>
                    <p className="mt-2 text-sm text-gray-400">Click to upload an image</p>
                </div>
            )}
        </div>
        
          {/* Prompt Area */}
          <div className="flex flex-col flex-grow">
            <label htmlFor="prompt" className="text-lg font-semibold text-gray-300 mb-2">
              {isEditing ? 'Edit Instruction' : 'Your Creative Prompt'}
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isEditing ? 'e.g., "Add a futuristic city in the background"' : "Describe the image you want to create..."}
              className="flex-grow w-full bg-gray-900/70 border border-gray-600 rounded-lg p-4 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 resize-none"
              rows={isEditing ? 5 : 10}
            />
          </div>

          <button
            onClick={handleGenerateOrEdit}
            disabled={isLoading || !prompt.trim()}
            className="mt-6 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-lg font-semibold rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
          >
            {isLoading ? (
              <>
                <Spinner />
                {isEditing ? 'Editing...' : 'Generating...'}
              </>
            ) : (
              <>
                <SparklesIcon className="w-6 h-6 mr-2" />
                {isEditing ? 'Edit Image' : 'Generate Image'}
              </>
            )}
          </button>
        </div>

        {/* Right Column: Image Display */}
        <div className="flex flex-col items-center justify-center bg-gray-800/50 rounded-2xl shadow-lg p-6 backdrop-blur-sm border border-gray-700/50 min-h-[400px] lg:min-h-0">
          {error && (
            <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">
              <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2 text-red-500"/>
              <p className="font-semibold">Operation Failed</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          {isLoading && !error && (
            <div className="text-center text-gray-400">
               <div className="animate-pulse">
                <PhotoIcon className="w-24 h-24 mx-auto text-gray-600" />
                <p className="mt-4 text-lg">Conjuring your vision...</p>
                <p className="text-sm">This can take a moment.</p>
              </div>
            </div>
          )}
          {!isLoading && !generatedImageUrl && !error && (
            <div className="text-center text-gray-500">
              <PhotoIcon className="w-24 h-24 mx-auto" />
              <p className="mt-4 text-lg">Your generated image will appear here</p>
            </div>
          )}
          {generatedImageUrl && (
            <div className="w-full h-full">
              <img
                src={generatedImageUrl}
                alt="Generated by AI"
                className="w-full h-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;