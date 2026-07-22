import React, { useState } from 'react';
import './QuestionForm.css';

interface QuestionFormProps {
  question: string;
  options: string[];
  onAnswer: (answer: string) => void;
}

export function QuestionForm({ question, options, onAnswer }: QuestionFormProps) {
  const [customText, setCustomText] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    if (selected) return;
    setSelected(option);
    onAnswer(option);
  };

  const handleCustomSend = () => {
    if (selected || !customText.trim()) return;
    const text = customText.trim();
    setSelected(text);
    onAnswer(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomSend();
    }
  };

  return (
    <div className="question-form">
      <div className="question-form-prompt">{question}</div>
      <div className="question-form-options">
        {options.map((opt, i) => (
          <button
            key={i}
            className={`question-form-option${selected === opt ? ' selected' : ''}`}
            onClick={() => handleOptionClick(opt)}
            disabled={selected !== null}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="question-form-custom">
        <div className="question-form-custom-label">Or type your own answer</div>
        <div className="question-form-custom-row">
          <input
            className="question-form-custom-input"
            type="text"
            placeholder="Type your answer..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={selected !== null}
          />
          <button
            className="question-form-custom-send"
            onClick={handleCustomSend}
            disabled={!customText.trim() || selected !== null}
            title="Send"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
