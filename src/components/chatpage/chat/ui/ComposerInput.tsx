import React, { useRef, useEffect, useState } from 'react';

// Radha
interface ComposerInputProps { // Radha

  // Radha
  message: string;
  onChange: (message: string) => void;
  onSend: (attachedImages: string[], attachedPdfs: string[]) => void;
  onImageClick?: (url: string) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
}

// High-Performance image compression via canvas and object URLs to avoid huge string allocations
const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200): Promise<string> => {
  return new Promise((resolve) => {
    // Generate a lightweight object URL referencing the file in browser memory
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    
    img.onload = () => {
      // Free memory immediately
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Universally compress all input formats (PNG, BMP, GIF, WebP) to a high-quality jpeg (0.85 quality)
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        resolve("");
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("");
    };
  });
};

export function ComposerInput({ 
  message, 
  onChange, 
  onSend,
  onImageClick,
  isGenerating,
  onStopGeneration
}: ComposerInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [attachedPdfs, setAttachedPdfs] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Automatically adjust height on message changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
      
      // Allow scrolling only after reaching the max-height limit (160px)
      if (scrollHeight >= 160) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const handleSendPrompt = () => {
    if (!message.trim() && attachedImages.length === 0 && attachedPdfs.length === 0) return;
    onSend(attachedImages, attachedPdfs);
    setAttachedImages([]);
    setAttachedPdfs([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const remainingSlots = 5 - (attachedImages.length + attachedPdfs.length);
      
      if (filesArray.length > remainingSlots) {
        alert("Maximum 5 attachments allowed.");
      }

      const filesToProcess = filesArray.slice(0, remainingSlots);
      
      filesToProcess.forEach(async (file) => {
        try {
          const compressed = await compressImage(file);
          if (compressed) {
            setAttachedImages(prev => {
              if (prev.length >= 5) return prev;
              return [...prev, compressed];
            });
          }
        } catch (err) {
          console.error("Compression failed:", err);
        }
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const remainingSlots = 5 - (attachedImages.length + attachedPdfs.length);

      if (filesArray.length > remainingSlots) {
        alert("Maximum 5 attachments allowed.");
      }

      const filesToProcess = filesArray.slice(0, remainingSlots);

      filesToProcess.forEach(file => {
        if (file.size > 50 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Maximum size allowed is 50MB.`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result && typeof event.target.result === 'string') {
            setAttachedPdfs(prev => {
              if (prev.length >= 5) return prev;
              return [...prev, event.target.result as string];
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setAttachedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(prev => !prev);
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (attachedImages.length + attachedPdfs.length >= 5) {
      alert("Maximum 5 attachments allowed.");
      setIsDropdownOpen(false);
      return;
    }
    fileInputRef.current?.click();
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = () => {
      setIsDropdownOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isDropdownOpen]);

  return (
    <div className="composer-wrapper" style={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
      {/* Hidden file inputs supporting images and PDFs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
        multiple 
        onChange={handleFileChange} 
      />
      <input 
        type="file" 
        ref={pdfInputRef} 
        style={{ display: 'none' }} 
        accept="application/pdf" 
        multiple 
        onChange={handlePdfChange} 
      />

      {/* Uploaded base64 thumbnail and PDF previews sticking just above the input capsule */}
      {(attachedImages.length > 0 || attachedPdfs.length > 0) && (
        <div className="composer-image-previews">
          {attachedImages.map((img, idx) => (
            <div 
              key={'img_' + idx} 
              className="composer-image-thumbnail-wrapper"
              onClick={() => onImageClick?.(img)}
              style={{ cursor: 'pointer' }}
            >
              <img src={img} alt="attached thumbnail preview" className="composer-image-thumbnail" />
              <button 
                type="button" 
                className="composer-image-remove-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(idx);
                }}
                aria-label="Remove image"
              >
                <svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}

          {attachedPdfs.map((_pdf, idx) => (
            <div key={'pdf_' + idx} className="composer-file-capsule">
              <div className="composer-file-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <span className="composer-file-name">PDF Document</span>
              <button 
                type="button" 
                className="composer-image-remove-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  setAttachedPdfs(prev => prev.filter((_, i) => i !== idx));
                }}
                aria-label="Remove PDF"
              >
                <svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="chat-input-capsule">
        <textarea
          ref={textareaRef}
          className="composer-textarea"
          placeholder="Ask anything..."
          value={message}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          id="input-chat-message"
        />

        {/* Liquid Glass Attachment trigger button positioned at the bottom left */}
        <div className="composer-dropdown-wrapper">
          <button 
            className="composer-add-btn" 
            id="btn-add-attachment" 
            aria-label="Add Attachment"
            type="button"
            onClick={handleToggleDropdown}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>

          {/* Dropup upload options menu */}
          {isDropdownOpen && (
            <div className="composer-dropup-menu" onClick={(e) => e.stopPropagation()}>
              <ul className="dropdown-list">
                <li className="dropdown-item">
                  <button 
                    type="button" 
                    className="dropdown-action-btn"
                    onClick={handleUploadClick}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                    <span>Upload Image</span>
                  </button>
                </li>
                <li className="dropdown-item">
                  <button 
                    type="button" 
                    className="dropdown-action-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      pdfInputRef.current?.click();
                      setIsDropdownOpen(false);
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span>Upload PDF</span>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

        <button 
          className={`composer-send-btn ${isGenerating ? 'stop-active' : ''}`} 
          id="btn-send-message" 
          aria-label={isGenerating ? "Stop Message" : "Send Message"}
          type="button"
          onClick={isGenerating ? onStopGeneration : handleSendPrompt}
        >
          {isGenerating ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stop-icon">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="send-icon-svg">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          )}
          <span className="tooltip tooltip-above tooltip-right-align">
            {isGenerating ? "Stop generating query response" : "Send query to the physics intelligence companion."}
          </span>
        </button>
      </div>
    </div>
  );
}
