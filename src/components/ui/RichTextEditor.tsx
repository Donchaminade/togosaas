import { useEffect, useRef } from 'react';
import { Bold, ImagePlus, Italic, Link2, List, ListOrdered, Underline } from 'lucide-react';
import { api, ApiError, API_BASE_URL } from '../../lib/api';
import { useToast } from './Toast';

function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

interface RichTextEditorProps {
  /** HTML initial (appliqué une seule fois au montage). Changez `key` pour réinitialiser. */
  initialHtml?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  /** Autorise l'insertion d'images (upload + image distante). */
  allowImages?: boolean;
}

export default function RichTextEditor({
  initialHtml = '',
  onChange,
  placeholder = 'Rédigez votre message ici…',
  minHeight = 200,
  allowImages = true,
}: RichTextEditorProps) {
  const { notify } = useToast();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editorRef.current && initialHtml !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialHtml;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => onChange(editorRef.current?.innerHTML ?? '');

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    emit();
  };

  const handleInsertLink = () => {
    const url = window.prompt('URL du lien (https://…)');
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      notify('Le lien doit commencer par http:// ou https://', 'error');
      return;
    }
    exec('createLink', url);
  };

  const handleInsertImage = async (file: File) => {
    try {
      const res = await api.uploadFile(file);
      const url = absoluteUrl(res.data.url);
      exec('insertHTML', `<img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:8px;" />`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Échec de l'envoi de l'image.", 'error');
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
        <Btn onClick={() => exec('bold')} title="Gras"><Bold className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec('italic')} title="Italique"><Italic className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec('underline')} title="Souligné"><Underline className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600" />
        <Btn onClick={() => exec('insertUnorderedList')} title="Liste à puces"><List className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec('insertOrderedList')} title="Liste numérotée"><ListOrdered className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600" />
        <Btn onClick={handleInsertLink} title="Insérer un lien"><Link2 className="h-4 w-4" /></Btn>
        {allowImages && (
          <Btn onClick={() => imageInputRef.current?.click()} title="Insérer une image"><ImagePlus className="h-4 w-4" /></Btn>
        )}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="email-editor max-w-none px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none dark:text-slate-100 [&_a]:text-togo-green [&_a]:underline [&_img]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        aria-label="Insérer une image"
        title="Insérer une image"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleInsertImage(e.target.files[0])}
      />
    </div>
  );
}

function Btn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
    >
      {children}
    </button>
  );
}
