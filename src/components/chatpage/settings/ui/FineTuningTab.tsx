import { useState, useEffect } from 'react';
import { DEFAULT_TEMPERATURE, DEFAULT_TOP_P, DEFAULT_CUSTOM_INSTRUCTIONS } from '../../../../utils/ai/config';

export function FineTuningTab() {
  const [temperature, setTemperature] = useState<number>(() => {
    const stored = localStorage.getItem('physica_ai_temperature');
    return stored !== null ? parseFloat(stored) : DEFAULT_TEMPERATURE;
  });
  const [topP, setTopP] = useState<number>(() => {
    const stored = localStorage.getItem('physica_ai_top_p');
    return stored !== null ? parseFloat(stored) : DEFAULT_TOP_P;
  });
  const [customInstructions, setCustomInstructions] = useState<string>(() => {
    const stored = localStorage.getItem('physica_ai_custom_instructions');
    return stored !== null ? stored : DEFAULT_CUSTOM_INSTRUCTIONS;
  });
  const [tempInstructions, setTempInstructions] = useState<string>('');
  const [isEditingInstructions, setIsEditingInstructions] = useState<boolean>(false);

  // Sync state changes to localStorage dynamically with a debounce to prevent lag during dragging
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem('physica_ai_temperature', temperature.toString());
    }, 150);
    return () => clearTimeout(handler);
  }, [temperature]);

  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem('physica_ai_top_p', topP.toString());
    }, 150);
    return () => clearTimeout(handler);
  }, [topP]);

  useEffect(() => {
    localStorage.setItem('physica_ai_custom_instructions', customInstructions);
  }, [customInstructions]);

  // Reset parameters back to config file defaults
  const handleResetToDefaults = () => {
    setTemperature(DEFAULT_TEMPERATURE);
    setTopP(DEFAULT_TOP_P);
    setCustomInstructions(DEFAULT_CUSTOM_INSTRUCTIONS);
    setTempInstructions('');
    setIsEditingInstructions(false);
  };

  const handleTempMinus = () => {
    setTemperature(prev => Math.max(0, Math.round((prev - 0.05) * 100) / 100));
  };
  const handleTempPlus = () => {
    setTemperature(prev => Math.min(2, Math.round((prev + 0.05) * 100) / 100));
  };

  const handleTopPMinus = () => {
    setTopP(prev => Math.max(0, Math.round((prev - 0.05) * 100) / 100));
  };
  const handleTopPPlus = () => {
    setTopP(prev => Math.min(1, Math.round((prev + 0.05) * 100) / 100));
  };

  const handleEditInstructions = () => {
    setTempInstructions(customInstructions);
    setIsEditingInstructions(true);
  };

  const handleSaveInstructions = () => {
    setCustomInstructions(tempInstructions);
    setIsEditingInstructions(false);
  };

  const handleCancelInstructions = () => {
    setIsEditingInstructions(false);
  };

  const handleRemoveInstructions = () => {
    setCustomInstructions('');
  };

  const tempPercent = (temperature / 2) * 100;
  const topPPercent = topP * 100;

  return (
    <div className="tab-pane-content fade-in" id="fine-tuning-tab-pane">
      <div className="dashboard-header-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 className="tab-title" style={{ margin: 0 }}>Fine-tuning Settings</h2>
          <button 
            className="settings-action-btn secondary-action" 
            onClick={handleResetToDefaults}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'block' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            <span>Reset to Defaults</span>
          </button>
        </div>
        <p className="tab-description" style={{ margin: 0 }}>Experiment with parameters and model inference constraints in real-time.</p>
      </div>

      <div className="lab-options">
        <div className="lab-control-group">
          <label>Inference Temperature</label>
          <div className="lab-slider-row">
            <button className="slider-adjust-btn" onClick={handleTempMinus}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="0.01" 
              value={temperature} 
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="lab-slider" 
              style={{
                background: `linear-gradient(to right, #ffffff 0%, #ffffff ${tempPercent}%, rgba(255, 255, 255, 0.1) ${tempPercent}%, rgba(255, 255, 255, 0.1) 100%)`
              }}
            />
            <button className="slider-adjust-btn" onClick={handleTempPlus}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span className="slider-val">{temperature.toFixed(2)}</span>
          </div>
          <span className="control-help">Higher temperature produces more creative, less structured outputs.</span>
        </div>
        
        <div className="lab-control-group">
          <label>Top P (Nucleus Sampling)</label>
          <div className="lab-slider-row">
            <button className="slider-adjust-btn" onClick={handleTopPMinus}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={topP} 
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              className="lab-slider" 
              style={{
                background: `linear-gradient(to right, #ffffff 0%, #ffffff ${topPPercent}%, rgba(255, 255, 255, 0.1) ${topPPercent}%, rgba(255, 255, 255, 0.1) 100%)`
              }}
            />
            <button className="slider-adjust-btn" onClick={handleTopPPlus}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span className="slider-val">{topP.toFixed(2)}</span>
          </div>
        </div>

        <div className="lab-control-group" style={{ marginTop: '1rem' }}>
          <label>Custom Instructions</label>
          <textarea
            className={`lab-textarea ${isEditingInstructions ? 'editing' : 'readonly'}`}
            value={isEditingInstructions ? tempInstructions : customInstructions}
            onChange={(e) => setTempInstructions(e.target.value)}
            readOnly={!isEditingInstructions}
            placeholder="No custom instructions added. Click 'Add' to enter instructions."
          />
          <div className="instructions-actions">
            {isEditingInstructions ? (
              <>
                <button className="settings-action-btn primary-action" onClick={handleSaveInstructions}>
                  Save
                </button>
                <button className="settings-action-btn secondary-action" onClick={handleCancelInstructions}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className="settings-action-btn primary-action" onClick={handleEditInstructions}>
                  {customInstructions ? 'Edit' : 'Add'}
                </button>
                <button 
                  className="settings-action-btn remove-action" 
                  onClick={handleRemoveInstructions}
                  disabled={!customInstructions}
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
