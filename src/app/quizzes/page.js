"use client"
import React from 'react';
import {useState} from 'react';
// import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

function Basic(props) {
    const [files, setFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {fileRejections, getRootProps, getInputProps} = useDropzone({maxFiles: 4, onDrop: (acceptedFiles) => {
        // Add new files to existing ones (up to max of 4)
        setFiles(prev => {
            const combined = [...prev, ...acceptedFiles];
            return combined.slice(0, 4); // Keep only first 4
        });
    }
    });

    const removeFile = (fileToRemove) => {
        setFiles(files.filter(file => file !== fileToRemove));
    };

    const clearAll = () => {
        setFiles([]);
    }

     // Handle form submission
     const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (files.length === 0) {
            alert("Please select at least one file");
            return;
        }

        setIsSubmitting(true);

        // Create FormData and append files
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append(`file-${index}`, file);
        });

        // Log file names (for demonstration)
        console.log("Submitting files:");
        files.forEach(file => console.log(file.name));
        
        // Here you would typically send the formData to your server
        // Example: await fetch('/api/upload', { method: 'POST', body: formData });
        
        alert(`Submitting ${files.length} file(s):\n${files.map(f => f.name).join('\n')}`);
        
        // Clear files after successful submission
        setFiles([]);
        setIsSubmitting(false);
    }

    const filesList = files.map(file => (
        <li key = {file.path} className="flex justify-between items-center">
            <span>{file.path} - {file.size} bytes </span>
            <button 
                onClick={() => removeFile(file)}
                className="ml-2 text-red-500 hover:text-red-700"
            >
                Remove
            </button>
        </li>
    ));

    const fileRejectedItems = fileRejections.map(({file, errors }) => {
        return(
            <li key = {file.path}>
                {file.path} - {file.size} bytes
                <ul>
                    {errors.map(e => <li key={e.code}>{e.message}</li>)}
                </ul>
            </li>

        )
    });

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 text-gray 900">
            <div main="max-w-7xl mx-auto">
                {/* Header part where I will add key phrases of what our App does */}
                <div className="text-center mb-12 sm:mb-16">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
                        Ask your A.I. budd Mark
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                        Mark helps you cover and make notes for your classes and quiz
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <section className="container max-w-2xl mx-auto">
                        <div {...getRootProps({
                            className: `border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                                files.length >= 4 
                                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                                    : 'border-gray-300 hover:border-gray-400'
                            }`
                        })}>
                            <input {...getInputProps()} disabled={files.length >= 4}/>
                            <p className='text-blue-700 font-semibold'>Drag and Drop your files here, or you can click and select the files</p>
                            <em className='text-blue-700'>(Max 4 files are allowed - Currently: {files.length}/4)</em>
                        </div>
                        
                        {files.length > 0 && (
                            <aside className="mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-gray-600 font-semibold">Files Accepted ({files.length}/4)</h4>
                                    <button 
                                        type="button"  // Important: prevent form submission
                                        onClick={clearAll}
                                        className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <ul className="text-green-600 space-y-1">{filesList}</ul>
                            </aside>
                        )}
                        
                        {fileRejectedItems.length > 0 && (
                            <aside className="mt-4">
                                <h4 className="font-semibold text-red-600">Files Rejected</h4>
                                <ul>{fileRejectedItems}</ul>
                            </aside>
                        )}

                        {/* Submit button */}
                        <div className="mt-6 text-center">
                            <button 
                                type="submit"
                                disabled={files.length === 0 || isSubmitting}
                                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                    files.length === 0 || isSubmitting
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                            >
                                {isSubmitting ? 'Submitting...' : `Submit ${files.length} File(s)`}
                            </button>
                        </div>
                    </section>
                </form>
            </div>
            <h2 className="text-2xl p-4">This is our quizzes page and we will add more stuffs and features for quizzes</h2>
        </main>
    );
}

export default Basic;

