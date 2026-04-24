import React, { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import axios from 'axios';
import api from '../../lib/api';
import './FileUpload.css';

interface FileUploadProps {
  category: 'placement_drive' | 'course_content' | 'user_profile' | 'assignment_submission';
  acceptedTypes?: string; // e.g., "application/pdf,image/png"
  maxSizeMB?: number;
  onUploadComplete: (path: string) => void;
  onError?: (error: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  category,
  acceptedTypes = '*/*',
  maxSizeMB = 10,
  onUploadComplete,
  onError
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerSelect = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    setFileName(file.name);
    setProgress(0);

    // Basic local validation before hitting the API
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      const err = `File size exceeds the ${maxSizeMB}MB limit.`;
      setErrorMsg(err);
      if (onError) onError(err);
      return;
    }

    try {
      setIsUploading(true);

      // 1. Get Presigned URL from Backend Gatekeeper
      const response = await api.post('/upload/presigned', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        category
      });

      const { signedUrl, path } = response.data.data;

      // 2. Upload Directly to Supabase using the pre-signed URL
      await axios.put(signedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      });

      // 3. Complete
      setIsUploading(false);
      onUploadComplete(path);

    } catch (err: any) {
      setIsUploading(false);
      setProgress(0);
      
      const message = err.response?.data?.error?.message || err.message || 'An error occurred during upload';
      setErrorMsg(message);
      if (onError) onError(message);
    }
  };

  return (
    <div className="file-upload-container">
      <div 
        className={`file-dropzone ${isDragging ? 'drag-active' : ''} ${isUploading ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerSelect}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept={acceptedTypes}
          onChange={handleFileInput} 
        />
        
        <svg className="dropzone-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>

        <div className="dropzone-text">
          {isUploading ? 'Uploading...' : 'Click or drag file to this area to upload'}
        </div>
        <div className="dropzone-subtext">
          Support for {acceptedTypes === '*/*' ? 'most file types' : acceptedTypes.replace(/,/g, ', ')}. Max size: {maxSizeMB}MB
        </div>
      </div>

      {errorMsg && (
        <div className="upload-error">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errorMsg}
        </div>
      )}

      {isUploading && (
        <div className="upload-status">
          <div className="upload-info">
            <span className="upload-filename">{fileName}</span>
            <span className="upload-percentage">{progress}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
};
