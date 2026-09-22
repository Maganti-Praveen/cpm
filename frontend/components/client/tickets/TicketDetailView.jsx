import React, { useRef, useState, useEffect } from "react";
import { Clock, User, ArrowLeft, Loader2, Bold, Italic, List as ListIcon, Link as LinkIcon, Paperclip, Send, X, ShieldCheck, Lock, Eye } from "lucide-react";

// Helpers
const parseReplyMessage = (messageStr) => {
  if (!messageStr) return { subject: "Response Update", priority: "", message: "", attachment: null, attachmentName: "" };
  let cleanStr = messageStr;
  let isInternal = false;
  if (cleanStr.startsWith("[INTERNAL]")) {
    cleanStr = cleanStr.replace(/^\[INTERNAL\]\s*/, "");
    isInternal = true;
  }
  try {
    const parsed = JSON.parse(cleanStr);
    if (parsed && typeof parsed === "object" && parsed.hasOwnProperty("message")) {
      return {
        subject: parsed.subject || "Response Update",
        priority: parsed.priority || "",
        message: parsed.message || "",
        attachment: parsed.attachment || null,
        attachmentName: parsed.attachmentName || "attachment",
        isInternal
      };
    }
  } catch (e) {}
  return { subject: "Response Update", priority: "", message: cleanStr, attachment: null, attachmentName: "", isInternal };
};

const getInitials = (name) => {
  if (!name) return "U";
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export default function TicketDetailView({ ticket, user, onBack, onReplySubmit, loading, replyLoading }) {
  const [replyText, setReplyText] = useState("");
  const [replyAttachment, setReplyAttachment] = useState("");
  const [replyAttachmentName, setReplyAttachmentName] = useState("");
  
  const editorRef = useRef(null);
  const threadEndRef = useRef(null);
  const replyBoxRef = useRef(null);
  const [editorPlaceholderVisible, setEditorPlaceholderVisible] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [ticket]);

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Attachment must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setReplyAttachment(reader.result);
      setReplyAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const updateEditorState = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || "";
      setReplyText(editorRef.current.innerHTML);
      setEditorPlaceholderVisible(text.trim() === "");
    }
  };

  const execCommand = (e, cmd, val = null) => {
    e.preventDefault();
    focusEditor();
    if (cmd === 'createLink') {
      const url = prompt("Enter link URL:");
      if (url) document.execCommand(cmd, false, url);
    } else {
      document.execCommand(cmd, false, val);
    }
    updateEditorState();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      alert("Message is required.");
      return;
    }
    
    const payload = {
      subject: "Response", 
      priority: ticket.priority, 
      message: replyText,
      attachment: replyAttachment,
      attachmentName: replyAttachmentName
    };
    
    onReplySubmit(payload, () => {
      setReplyText("");
      setReplyAttachment("");
      setReplyAttachmentName("");
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
        setEditorPlaceholderVisible(true);
      }
      setTimeout(() => {
        threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
  };

  if (!ticket || loading) {
    return (
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const allResponses = ticket.replies?.filter(r => !r.isInternal && !r.message?.startsWith("[INTERNAL]")) || [];

  return (
    <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-xs h-full relative">
      
      {/* Header - Back button only visible on mobile */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white shrink-0 lg:hidden">
        <button onClick={onBack} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer border-none bg-transparent transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <h2 className="font-display font-bold text-slate-900 text-sm truncate">
            {ticket.subject}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">Ticket #{ticket.id}</p>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* Conversation Thread */}
        <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden relative">
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar">
            
            {/* Initial Request Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs text-left relative">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full text-white font-bold text-[9px] flex items-center justify-center shadow-xs shrink-0 bg-indigo-600`}>
                    {getInitials(user?.fullName)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-xs">{user?.fullName || "You"}</span>
                    <span className="ml-1.5 text-[8px] font-extrabold px-1 py-0.5 rounded border uppercase bg-slate-100 text-slate-600 border-slate-200">
                      Client
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-medium text-slate-400 flex items-center gap-0.5">
                  <Clock size={9} />
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>
              
              <h4 className="text-xs font-bold text-slate-900 mb-1.5 break-words">{ticket.subject}</h4>
              <div 
                className="text-[13px] text-slate-700 font-medium leading-relaxed whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: ticket.description }}
              />
              
              {ticket.attachment && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
                  <Paperclip size={12} className="text-slate-400" />
                  {(() => {
                    try {
                      const att = JSON.parse(ticket.attachment);
                      return (
                        <a href={att.data} download={att.name} className="text-[11px] font-bold text-indigo-600 hover:underline">
                          {att.name}
                        </a>
                      );
                    } catch(e) {
                      return <span className="text-[11px] text-slate-400">Attachment attached</span>;
                    }
                  })()}
                </div>
              )}
            </div>

            {/* Alternating Replies as Cards */}
            {allResponses.map((reply) => {
              const parsed = parseReplyMessage(reply.message);
              const isStaff = reply.user?.role !== "CLIENT";

              return (
                <div key={reply.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs text-left relative">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full text-white font-bold text-[9px] flex items-center justify-center shadow-xs shrink-0 ${isStaff ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                        {getInitials(reply.user?.fullName)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-xs">{reply.user?.fullName || (isStaff ? "Support Agent" : "You")}</span>
                        <span className={`ml-1.5 text-[8px] font-extrabold px-1 py-0.5 rounded border uppercase ${
                          isStaff ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {isStaff ? "Agent" : "Client"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 flex items-center gap-0.5">
                      <Clock size={9} />
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div 
                    className="text-[13px] text-slate-700 font-medium leading-relaxed whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: parsed.message }}
                  />
                  
                  {parsed.attachment && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
                      <Paperclip size={12} className="text-slate-400" />
                      <a href={parsed.attachment} download={parsed.attachmentName} className="text-[11px] font-bold text-indigo-600 hover:underline">
                        {parsed.attachmentName}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
            
            <div ref={threadEndRef} className="h-2" />
          </div>

          {/* Quick Reply Form */}
          {ticket.status !== "Closed" && ticket.status !== "Resolved" ? (
            <div ref={replyBoxRef} className="p-4 border-t border-slate-200 bg-white shrink-0">
              <form onSubmit={handleSubmit} className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all bg-white shadow-xs">
                
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1">
                  <button type="button" onClick={(e) => execCommand(e, 'bold')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors bg-transparent border-none cursor-pointer"><Bold size={14}/></button>
                  <button type="button" onClick={(e) => execCommand(e, 'italic')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors bg-transparent border-none cursor-pointer"><Italic size={14}/></button>
                  <button type="button" onClick={(e) => execCommand(e, 'insertUnorderedList')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors bg-transparent border-none cursor-pointer"><ListIcon size={14}/></button>
                  <button type="button" onClick={(e) => execCommand(e, 'createLink')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors bg-transparent border-none cursor-pointer"><LinkIcon size={14}/></button>
                </div>
                
                <div className="relative min-h-[80px] p-3">
                  {editorPlaceholderVisible && (
                    <div className="absolute top-3 left-3 text-slate-400 text-sm font-medium pointer-events-none select-none">
                      Type your reply here...
                    </div>
                  )}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={updateEditorState}
                    onFocus={() => setEditorPlaceholderVisible(false)}
                    onBlur={updateEditorState}
                    className="w-full h-full min-h-[80px] outline-none text-[13px] font-medium text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[250px] overflow-y-auto"
                  />
                </div>

                <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <label 
                      htmlFor="quick-reply-attachment"
                      className="text-slate-500 hover:text-slate-800 cursor-pointer p-1.5 hover:bg-slate-200 rounded transition-colors flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Paperclip size={14} />
                      <span className="hidden sm:inline">Attach File</span>
                    </label>
                    <input type="file" id="quick-reply-attachment" onChange={handleAttachmentChange} className="hidden" />
                    
                    {replyAttachment ? (
                      <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded text-[11px] font-semibold text-slate-600">
                        <span className="truncate max-w-[100px]">{replyAttachmentName}</span>
                        <button type="button" onClick={() => { setReplyAttachment(""); setReplyAttachmentName(""); }} className="text-rose-500 hover:text-rose-700 bg-transparent border-none cursor-pointer p-0"><X size={12}/></button>
                      </div>
                    ) : (
                      <span className="hidden sm:block text-[10px] text-slate-400 font-medium">(Max 5MB)</span>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={replyLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors shadow-xs flex items-center gap-1.5 border-none disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {replyLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={12} />}
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
             <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-[11px] font-bold text-slate-500 shrink-0">
               This ticket is closed. You can no longer reply.
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
