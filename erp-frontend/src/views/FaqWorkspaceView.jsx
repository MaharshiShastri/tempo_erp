import { FiMessageCircle, FiCheckCircle, FiClock, FiSend, FiFilter } from "react-icons/fi";

export default function FaqWorkspaceView({ state }) {
    const {faqs, filteredFaqs, newQuestion, setNewQuestion, answerTexts, setAnswerTexts, statusFilter, setStatusFilter, isLoading, isRnD, loadFaqs,
        handleAskQuestion, handleAnswerQuestion, handleFaqUpload} = state;
    
    return (
        <div className="frappe-card" style={{ maxWidth: 1000, margin: "0 auto", padding: 25 }}>
            <div className="system-header" style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiMessageCircle /> R&D Knowledge Base (FAQ)
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Sales inquiries and technical product resolutions. Data fuels future AI recommendations.
                </p>
            </div>
            {isRnD && (
                <div style={{ background: "var(--bg-main)", padding: "20px", borderRadius: "8px", marginBottom: "30px", border: "2px dashed var(--brand-accent)", textAlign: "center" }}>
                    <h4 style={{ margin: "0 0 10px 0" }}>Batch Import General FAQs</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "15px" }}>Drag and drop a .docx file containing alternating Q & A formats.</p>
                    <input type="file" accept=".docx" onChange={async (e) => {handleFaqUpload(e)}}
                    />
                </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "15px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
                <h4 style={{ margin: 0 }}>Knowledge Base Index</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiFilter style={{ color: 'var(--text-muted)' }} />
                    <select className="form-select-native" style={{ fontSize: '12px', padding: '4px 8px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">🔍 Show All</option>
                        <option value="pending">⏳ Pending Answers</option>
                        <option value="completed">✅ Resolved / Completed</option>
                    </select>
                </div>
            </div>

            {/* Sales Input Area */}
            <form onSubmit={handleAskQuestion} style={{ background: "var(--bg-main)", padding: "20px", borderRadius: "var(--radius-sm)", marginBottom: "30px", border: "1px solid var(--border-light)" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Ask a Technical Question</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        type="text" 
                        required 
                        className="form-input" 
                        placeholder="e.g. What is the maximum operating temperature of the TI-128C Oven?" 
                        value={newQuestion} 
                        onChange={e => setNewQuestion(e.target.value)} 
                    />
                    <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <FiSend /> Submit to R&D
                    </button>
                </div>
            </form>

            {/* FAQ List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {filteredFaqs.map(faq => (
                    <div key={faq.id} style={{ border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-surface)', padding: '20px' }}>
                        
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '20px', color: 'var(--brand-accent)' }}>Q.</div>
                            <div>
                                <strong style={{ fontSize: '15px' }}>{faq.question}</strong>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                                    Asked by {faq.asked_by.split('@')[0]} • {new Date(faq.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                            Asked by: {faq.asked_by.split('@')[0]} | {faq.created_at.split('T')[0]}
                        </div>

                        {faq.status === 'Answered' ? (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '15px', background: 'var(--bg-main)', padding: '15px', borderRadius: '6px' }}>
                                <div style={{ fontSize: '20px', color: 'var(--brand-success)' }}>A.</div>
                                <div style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                                    {faq.answer}
                                </div>
                            </div>
                        ) : (
                            isRnD && (
                                <div style={{ marginTop: '15px' }}>
                                    <textarea 
                                        className="form-input" 
                                        rows={3} 
                                        placeholder="Provide technical resolution here..." 
                                        value={answerTexts[faq.id] || ""} 
                                        onChange={e => setAnswerTexts(prev => ({ ...prev, [faq.id]: e.target.value }))}
                                    />
                                    <button 
                                        className="btn btn-success" 
                                        style={{ marginTop: '10px' }} 
                                        onClick={() => handleAnswerQuestion(faq.id)}
                                        disabled={!answerTexts[faq.id]?.trim()}
                                    >
                                        Publish Answer & Sync to DB
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}