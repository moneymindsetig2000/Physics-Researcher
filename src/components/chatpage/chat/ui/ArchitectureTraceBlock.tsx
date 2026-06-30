import React, { useState } from "react";
import type { TraceRecord } from "../../../../utils/ai/types";
import { 
  ChevronDown, 
  ChevronRight, 
  Cpu, 
  Binary, 
  Table2, 
  MessageSquareCode, 
  Globe2, 
  History
} from "lucide-react";

interface ArchitectureTraceBlockProps {
  trace: TraceRecord;
}

export const ArchitectureTraceBlock: React.FC<ArchitectureTraceBlockProps> = ({ trace }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Summarize trace state for quick overview
  const initialCount = trace.retrievalTable ? trace.retrievalTable.filter(r => r.status === 'Included').length : 0;
  const finalInjectedCount = trace.injectedIntoModelContext !== undefined ? trace.injectedIntoModelContext : initialCount;

  // Dynamic thinking mode resolution
  const isHighThinking = trace.thinkingLevel === 'High' || trace.thinkingLevel === 'thinking' || trace.thinkingLevel === 'deep';
  let thinkingLabel = 'Minimal';
  if (trace.thinkingLevel === 'fast') {
    thinkingLabel = 'Fast Answer';
  } else if (trace.thinkingLevel === 'thinking') {
    thinkingLabel = 'Thinking';
  } else if (trace.thinkingLevel === 'deep' || trace.thinkingLevel === 'High') {
    thinkingLabel = 'Deep Reasoning';
  }

  return (
    <div className="trace-block-container" style={{ margin: '12px 0', fontFamily: 'monospace', fontSize: '0.75rem' }}>
      {/* Header / Accordion trigger - Liquid Glass button design */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="trace-block-trigger"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'between',
          padding: '10px 16px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: '8px',
          color: '#ffffff',
          cursor: 'pointer',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 -1px 1px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.25)',
          transition: 'all 0.3s ease',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, textAlign: 'left' }}>
          {isOpen ? <ChevronDown size={14} style={{ color: '#10b981' }} /> : <ChevronRight size={14} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />}
          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.85)' }}>
            PIPELINE_DIAGNOSTICS // [0x4F22]
          </span>
          <span style={{ 
            fontSize: '0.62rem', 
            color: '#10b981', 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid rgba(16, 185, 129, 0.2)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontWeight: 'bold'
          }}>
            {finalInjectedCount} RECALLS
          </span>
        </div>
        
        <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.45)' }}>
          {isOpen ? "Collapse Log" : "Expand Log"}
        </div>
      </button>

      {/* Accordion content area - Liquid Glass body */}
      {isOpen && (
        <div 
          className="trace-block-content"
          style={{
            marginTop: '8px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            color: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxSizing: 'border-box'
          }}
        >
          {/* STEP 1 — Reasoning Decision */}
          <div style={{ borderLeft: '2px solid #8b5cf6', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 'bold' }}>
              <Cpu size={14} style={{ color: '#8b5cf6' }} />
              <span>STEP 1 — Reasoning Decision: ON_DEMAND_RETRIEVAL_EVAL</span>
            </div>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.4 }}>
              Analyzed the incoming query to evaluate if long-term memory retrieval is required.
            </p>
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              border: '1px solid rgba(255, 255, 255, 0.06)', 
              borderRadius: '6px', 
              padding: '10px 14px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px',
              fontSize: '0.72rem'
            }}>
              <div>
                <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Memory Required: </span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: trace.memoryRequired ? '#34d399' : '#f59e0b',
                  background: trace.memoryRequired ? 'rgba(52, 211, 153, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontSize: '0.65rem'
                }}>
                  {trace.memoryRequired ? 'YES' : 'NO'}
                </span>
              </div>
              <div>
                <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Reason: </span>
                <span style={{ color: '#ffffff', fontStyle: 'italic' }}>"{trace.decisionReason || 'Decision processed.'}"</span>
              </div>
            </div>
          </div>

          {!trace.memoryRequired ? (
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.04)', 
              border: '1px solid rgba(245, 158, 11, 0.15)', 
              borderRadius: '8px', 
              padding: '16px', 
              textAlign: 'center', 
              fontStyle: 'italic',
              color: '#f59e0b'
            }}>
              ⚡ Memory Retrieval Skipped — Standalone or general query.
            </div>
          ) : (
            <>
              {/* STEP 2: Vector Embedding */}
              <div style={{ borderLeft: '2px solid #3b82f6', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 'bold' }}>
                  <Binary size={14} style={{ color: '#3b82f6' }} />
                  <span>STEP 2: VECTOR_EMBEDDING_GENERATION</span>
                </div>
                <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.4 }}>
                  Invoked <code style={{ color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 4px', borderRadius: '3px' }}>gemini-embedding-2-preview</code> to project query into high-dimensional vector space.
                </p>
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  border: '1px solid rgba(255, 255, 255, 0.06)', 
                  borderRadius: '6px', 
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'between',
                  alignItems: 'center',
                  fontSize: '0.72rem'
                }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Embedding Dimension: {trace.queryEmbeddingLength}-dim vector</span>
                  <span style={{ color: '#34d399', fontWeight: 'bold', background: 'rgba(52, 211, 153, 0.1)', padding: '2px 6px', borderRadius: '3px', fontSize: '0.62rem' }}>SUCCESS</span>
                </div>
              </div>

              {/* STEP 3: Knowledge Retrieval & RAG */}
              <div style={{ borderLeft: '2px solid #a855f7', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 'bold' }}>
                  <Table2 size={14} style={{ color: '#a855f7' }} />
                  <span>STEP 3: KNOWLEDGE_RETRIEVAL_AND_RAG</span>
                </div>
                <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.4 }}>
                  Executed parallel evaluations on the vector database. Fused Cosine Similarity (70%) and Keyword Overlap (30%), augmented by importance/recency boosts.
                </p>
                
                <div style={{ 
                  overflowX: 'auto', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '8px', 
                  background: 'rgba(0, 0, 0, 0.15)'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 12px' }}>Title</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Cosine</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Keyword</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', color: '#a855f7' }}>Final score</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: '0.7rem' }}>
                      {!trace.retrievalTable || trace.retrievalTable.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.35)' }}>
                            No memories indexed in database.
                          </td>
                        </tr>
                      ) : (
                        trace.retrievalTable.map((row, i) => {
                          const isIncluded = row.status === 'Included';
                          return (
                            <tr 
                              key={i} 
                              style={{ 
                                background: isIncluded ? 'rgba(52, 211, 153, 0.03)' : 'transparent',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                color: isIncluded ? '#ffffff' : 'rgba(255, 255, 255, 0.45)'
                              }}
                            >
                              <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>{row.title}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{row.cosineSim.toFixed(3)}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{row.keywordScore.toFixed(3)}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', color: isIncluded ? '#34d399' : 'inherit' }}>{row.finalRankScore.toFixed(3)}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', color: isIncluded ? '#34d399' : 'inherit' }}>
                                {isIncluded ? '✅ Included' : 'Filtered'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* STEP 3.5: LLM Relevance Reranker */}
              <div style={{ borderLeft: '2px solid #ec4899', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 'bold' }}>
                  <MessageSquareCode size={14} style={{ color: '#ec4899' }} />
                  <span>STEP 3.5: LLM Relevance Reranker (Intent Filter)</span>
                </div>
                <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.4 }}>
                  Passed score-included candidates through a lightweight LLM gatekeeper to verify conceptual utility.
                </p>

                <div style={{ 
                  overflowX: 'auto', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '8px', 
                  background: 'rgba(0, 0, 0, 0.15)'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 12px' }}>Title</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Relevant?</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Confidence</th>
                        <th style={{ padding: '8px 12px' }}>Reason</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: '0.7rem' }}>
                      {!trace.rerankerTable || trace.rerankerTable.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.35)' }}>
                            No candidates passed the score threshold to evaluate.
                          </td>
                        </tr>
                      ) : (
                        trace.rerankerTable.map((row, i) => {
                          const isRelevant = row.relevant;
                          const isIncluded = row.status === 'Included';
                          return (
                            <tr 
                              key={i} 
                              style={{ 
                                background: isIncluded ? 'rgba(52, 211, 153, 0.03)' : 'rgba(239, 68, 68, 0.01)',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                color: isIncluded ? '#ffffff' : 'rgba(255, 255, 255, 0.45)'
                              }}
                            >
                              <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>{row.title}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', color: isRelevant ? '#34d399' : '#f87171', fontWeight: 'bold' }}>
                                {isRelevant ? 'Relevant' : 'Not Relevant'}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{row.confidence.toFixed(2)}</td>
                              <td style={{ padding: '8px 12px', fontStyle: 'italic' }}>"{row.reason}"</td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', color: isIncluded ? '#34d399' : '#f87171' }}>
                                {isIncluded ? 'Included' : 'Removed'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          )}

          {/* STEP 5: Model Execution & Grounding */}
          <div style={{ borderLeft: '2px solid #f59e0b', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 'bold' }}>
              <Globe2 size={14} style={{ color: '#f59e0b' }} />
              <span>STEP 5: REASONING_MODEL_EXECUTION_AND_GROUNDING</span>
            </div>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.4 }}>
              Invoked main reasoning LLM with ground query tools.
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px',
              fontSize: '0.72rem'
            }}>
              <div style={{ 
                background: isHighThinking ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)', 
                border: isHighThinking ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '6px', 
                padding: '10px' 
              }}>
                <span style={{ color: isHighThinking ? 'rgba(139, 92, 246, 0.7)' : 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Thinking Mode:</span>
                <span style={{ color: isHighThinking ? '#a78bfa' : '#ffffff', fontWeight: 'bold', display: 'block', marginTop: '2px' }}>
                  {thinkingLabel}
                </span>
              </div>
              <div style={{ 
                background: trace.searchUsed ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255, 255, 255, 0.02)', 
                border: trace.searchUsed ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '6px', 
                padding: '10px' 
              }}>
                <span style={{ color: trace.searchUsed ? 'rgba(52, 211, 153, 0.7)' : 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Google Search:</span>
                <span style={{ 
                  color: trace.searchUsed ? '#34d399' : 'rgba(255, 255, 255, 0.45)', 
                  fontWeight: 'bold',
                  display: 'block',
                  marginTop: '2px'
                }}>
                  {trace.searchUsed ? 'ACTIVE (Google Search executed)' : 'INACTIVE (Not needed)'}
                </span>
              </div>
            </div>

            {trace.searchUsed && trace.searchQueries.length > 0 && (
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.25)', 
                border: '1px solid rgba(255, 255, 255, 0.06)', 
                borderRadius: '6px', 
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.7rem'
              }}>
                <div>
                  <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Queries Issued:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {trace.searchQueries.map((q, idx) => (
                      <span key={idx} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '4px', color: 'rgba(255, 255, 255, 0.8)' }}>
                        {q}
                      </span>
                    ))}
                  </div>
                </div>

                {trace.searchSources.length > 0 && (
                  <div>
                    <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Grounding Citations:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', maxHeight: '100px', overflowY: 'auto' }}>
                      {trace.searchSources.map((src, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>[{idx + 1}]</span>
                          <a href={src.uri} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', flexShrink: 0 }}>[Link]</a>
                          <span style={{ color: 'rgba(255, 255, 255, 0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 6: Classifier Evaluation */}
          <div style={{ borderLeft: '2px solid #10b981', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 'bold' }}>
              <History size={14} style={{ color: '#10b981' }} />
              <span>STEP 6: ADAPTIVE_MEMORY_CLASSIFIER_AGENT</span>
            </div>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.4 }}>
              Processed user statement to log preference profile updates or deletion queries.
            </p>
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.25)', 
              border: '1px solid rgba(255, 255, 255, 0.06)', 
              borderRadius: '6px', 
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontSize: '0.72rem'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px'
              }}>
                <div>
                  <span style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Saved New Memory:</span>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: trace.evalResult.shouldSave ? '#10b981' : 'rgba(255,255,255,0.45)', 
                    textTransform: 'uppercase' 
                  }}>
                    {trace.evalResult.shouldSave ? 'TRUE' : 'FALSE'}
                  </span>
                  {trace.evalResult.shouldSave && trace.evalResult.newMemory && (
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px', fontStyle: 'italic', fontSize: '0.68rem' }}>
                      Title: {trace.evalResult.newMemory.title}
                    </div>
                  )}
                </div>
                <div>
                  <span style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block' }}>Deleted Memory:</span>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: trace.evalResult.shouldDelete ? '#ef4444' : 'rgba(255,255,255,0.45)', 
                    textTransform: 'uppercase' 
                  }}>
                    {trace.evalResult.shouldDelete ? 'TRUE' : 'FALSE'}
                  </span>
                  {trace.evalResult.shouldDelete && trace.evalResult.deleteMemoryTitle && (
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px', fontStyle: 'italic', fontSize: '0.68rem' }}>
                      Removed: {trace.evalResult.deleteMemoryTitle}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
