import React, { useState, useRef } from "react";
import { Loader2, Paperclip, X, Bold, Italic, List as ListIcon, Link as LinkIcon, ShieldCheck } from "lucide-react";

export default function OpenTicketForm({ user, onSubmit, loading, onCancel }) {
  // Form State
  const [department, setDepartment] = useState("Technical");
  const [relatedService, setRelatedService] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentError, setAttachmentError] = useState("");

  const editorRef = useRef(null);
  const [editorPlaceholderVisible, setEditorPlaceholderVisible] = useState(true);

  const departments = [
    { id: "Technical", name: "Technical Support", desc: "Server, hosting, and technical issues." },
    { id: "Sales", name: "Sales & Billing", desc: "Invoices, payments, and pre-sales questions." },
    { id: "Domain", name: "Domain Management", desc: "Domain registration, transfers, and DNS." },
    { id: "General", name: "General Inquiry", desc: "Other non-technical questions." }
  ];

  const services = [
    "None",
    "Web Hosting Basic",
    "VPS Cloud Server",
    "Dedicated Server",
    "Domain Name - example.com"
  ];

  const handleDepartmentSelect = (deptId) => {
    setDepartment(deptId);
    setStep(2);
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAttachmentError("Attachment must be under 5MB.");
      if (showToast) showToast("Attachment must be under 5MB.", "error");
      e.target.value = null;
      return;
    }
    setAttachmentError("");
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment(reader.result);
      setAttachmentName(file.name);
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
      setMessage(editorRef.current.innerHTML);
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
    if (!subject.trim() || !message.trim()) {
      alert("Subject and Message are required.");
      return;
    }

    onSubmit({
      subject,
      category: department,
      priority,
      description: message,
      attachment,
      attachmentName
    });
  };

  return (
    <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-xs h-full">
      <div className="p-5 border-b border-slate-100 bg-white">
        <h2 className="font-display font-bold text-slate-900 text-lg">Create Ticket</h2>
        <p className="text-[11px] text-slate-500 font-medium mt-1">Please provide the details of your support request below.</p>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50/30 p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          
          <div className="p-5 space-y-5">
            {/* Row 1: Name & Email (Readonly) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Name</label>
                <input 
                  type="text" 
                  readOnly 
                  value={user?.fullName || ""} 
                  className="w-full h-10 px-3.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold select-none outline-none cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Email Address</label>
                <input 
                  type="email" 
                  readOnly 
                  value={user?.email || ""} 
                  className="w-full h-10 px-3.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold select-none outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Row 2: Department, Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Department</label>
                <select 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  aria-label="Department" aria-label="Priority" className="w-full h-10 px-3.5 bg-white border border-slate-200 text-slate-900 rounded-lg text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Priority</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-10 px-3.5 bg-white border border-slate-200 text-slate-900 rounded-lg text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Subject</label>
              <input 
                type="text" 
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of the issue"
                className="w-full h-10 px-3.5 bg-white border border-slate-200 text-slate-900 rounded-lg text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>

            {/* Message Body (Rich Text) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Message</label>
              <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all bg-white">
                <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-1">
                  <button type="button" onClick={(e) => execCommand(e, 'bold')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors bg-transparent border-none cursor-pointer" aria-label="Bold text"><Bold size={14}/></button>
                  <button type="button" onClick={(e) => execCommand(e, 'italic')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors bg-transparent border-none cursor-pointer" aria-label="Italic text"><Italic size={14}/></button>
                  <button type="button" onClick={(e) => execCommand(e, 'insertUnorderedList')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors bg-transparent border-none cursor-pointer" aria-label="Bullet list"><ListIcon size={14}/></button>
                  <button type="button" onClick={(e) => execCommand(e, 'createLink')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors bg-transparent border-none cursor-pointer" aria-label="Insert link"><LinkIcon size={14}/></button>
                </div>
                <div className="relative min-h-[150px] p-4">
                  {editorPlaceholderVisible && (
                    <div className="absolute top-4 left-4 text-slate-400 text-sm font-medium pointer-events-none select-none">
                      Describe your issue in detail...
                    </div>
                  )}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={updateEditorState}
                    onFocus={() => setEditorPlaceholderVisible(false)}
                    onBlur={updateEditorState}
                    className="w-full h-full min-h-[150px] outline-none text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed" role="textbox" aria-label="Message"
                  />
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-700">Attachments</label>
              <div className="flex items-center gap-3">
                <label 
                  htmlFor="new-ticket-attachment"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 cursor-pointer font-bold text-xs flex items-center gap-2 transition-colors select-none"
                >
                  <Paperclip size={14} />
                  <span>Choose File</span>
                </label>
                <input 
                  type="file" 
                  id="new-ticket-attachment" 
                  onChange={handleAttachmentChange}
                  className="hidden" 
                />
                
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-slate-500 truncate">
                    {attachment ? attachmentName : "No file chosen (Allowed: .gif, .jpg, .png, .pdf, .zip, .txt | Max 5MB)"}
                  </span>
                  {attachment && (
                    <button
                      type="button"
                      onClick={() => { setAttachment(""); setAttachmentName(""); }}
                      className="p-1 hover:bg-slate-100 hover:text-rose-600 rounded text-slate-400 border-none bg-transparent cursor-pointer transition-colors"
                      title="Remove attachment"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              {attachmentError && (
                <p className="text-rose-600 text-xs font-bold mt-1">{attachmentError}</p>
              )}
            </div>
          </div>

          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors border-none shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                <span>Create Ticket</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
