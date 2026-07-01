import React, { useState, useEffect } from "react";
import API from "../api/api";
import { FiMessageCircle, FiCheckCircle, FiClock, FiSend } from "react-icons/fi";

export default function FaqWorkspaceView({ state }) {
    const [faqs, setFaqs] = useState([]);
    const [newQuestion, setNewQuestion] = useState("");
    const [answerTexts, setAnswerTexts] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const isRnD = ["R&D Engineer", "Admin", "Chief Full Stack Developer"].includes(state.user.role);

    useEffect(() => { loadFaqs(); }, []);

    const loadFaqs = async () => {
        try {
            const data = await API.fetchFaqs(state.user.access_token);
            setFaqs(data);
        } catch (err) { state.showErrorModal("Fetch Error", err.message); }
    };

    const handleAskQuestion = async (e) => {
        e.preventDefault();
        if (!newQuestion.trim()) return;
        setIsLoading(true);
        try {
            await API.askFaqQuestion({ question: newQuestion }, state.user.access_token);
            setNewQuestion("");
            await loadFaqs();
            state.setAlertMessage("✅ Question submitted to R&D.");
            state.setIsAlertOpen(true);
        } catch (err) { state.showErrorModal("Error", err.message); }
        finally { setIsLoading(false); }
    };

    const handleAnswerQuestion = async (faqId) => {
        const answer = answerTexts[faqId];
        if (!answer?.trim()) return;
        
        try {
            await API.answerFaqQuestion(faqId, { answer }, state.user.access_token);
            setAnswerTexts(prev => ({ ...prev, [faqId]: "" }));
            await loadFaqs();
            state.setAlertMessage("✅ Answer saved to Vector Database.");
            state.setIsAlertOpen(true);
        } catch (err) { state.showErrorModal("Error", err.message); }
    };

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
                    <input type="file" accept=".docx" onChange={async (e) => {if(!e.target.files[0]) return; const formData = new FormData(); formData.append("file", e.target.files[0]);
                    try {
                                await API.uploadFaqDoc(formData, state.user.access_token);
                                state.addToast("FAQ Document parsed and embedded successfully.", "success");
                                loadFaqs();
                            } catch(err) { state.showErrorModal("Upload Failed", err.message); }
                        }}
                    />
                </div>
            )}
            
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
                {faqs.map(faq => (
                    <div key={faq.id} style={{ border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-surface)', padding: '20px' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>Q: {faq.question}</strong>
                            <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', background: faq.status === 'Answered' ? '#eaffea' : 'var(--bg-main)', color: faq.status === 'Answered' ? 'var(--brand-success)' : 'var(--text-muted)', border: `1px solid ${faq.status === 'Answered' ? 'var(--brand-success)' : 'var(--border-light)'}`}}>
                                {faq.status === 'Answered' ? <><FiCheckCircle style={{verticalAlign: 'middle', marginRight: '4px'}}/> Answered</> : <><FiClock style={{verticalAlign: 'middle', marginRight: '4px'}}/> Pending</>}
                            </span>
                        </div>
                        
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                            Asked by: {faq.asked_by.split('@')[0]} | {faq.created_at.split('T')[0]}
                        </div>

                        {faq.status === 'Answered' ? (
                            <div style={{ background: 'var(--bg-main)', padding: '15px', borderRadius: '6px', borderLeft: '4px solid var(--brand-accent)' }}>
                                <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{faq.answer}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'right' }}>
                                    Resolved by R&D ({faq.answered_by.split('@')[0]})
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