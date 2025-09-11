import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
  Box,
  ButtonGroup,
  IconButton,
  Divider,
  CircularProgress,
  Tooltip,
  Alert
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberedListIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
} from '@mui/icons-material';
import googleDriveService from '../services/googleDriveService';

const TiptapEditor = ({ 
  value = '', 
  onChange, 
  onBlur,
  placeholder = 'Start typing...',
  minHeight = '150px',
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'tiptap-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      TextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    onBlur: ({ editor }) => {
      if (onBlur) {
        onBlur(editor.getHTML());
      }
    },
    editable: !disabled,
  });

  // Update editor content when value prop changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Image must be smaller than 10MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select a valid image file');
        return;
      }

      setUploading(true);
      setUploadError(null);

      try {
        const imageUrl = await googleDriveService.uploadImage(file);
        
        if (editor) {
          editor.chain().focus().setImage({ 
            src: imageUrl,
            alt: file.name,
            title: file.name 
          }).run();
        }
      } catch (error) {
        console.error('Image upload failed:', error);
        setUploadError(error.message || 'Failed to upload image');
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  if (!editor) {
    return <Box sx={{ p: 2 }}>Loading editor...</Box>;
  }

  return (
    <Box className="tiptap-editor" sx={{ 
      border: '1px solid #e0e0e0', 
      borderRadius: 2,
      backgroundColor: '#ffffff !important',
      '& .ProseMirror': {
        minHeight,
        padding: '12px',
        outline: 'none',
        backgroundColor: '#ffffff !important',
        color: '#000000 !important',
        '& p': {
          margin: '2px 0 !important',
        },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          margin: '8px 0 4px 0 !important',
          fontWeight: 600,
        },
        '& ul, & ol': {
          paddingLeft: '20px',
          margin: '4px 0 !important',
        },
        '& li': {
          margin: '2px 0 !important',
        },
        '& img': {
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '4px',
          margin: '4px 0',
        },
        '& a': {
          color: '#1976d2',
          textDecoration: 'underline',
        },
        '&:empty:before': {
          content: `"${placeholder}"`,
          color: '#999',
          pointerEvents: 'none',
        }
      }
    }}>
      {/* Toolbar */}
      <Box className="tiptap-toolbar" sx={{ 
        p: 1, 
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#ffffff !important',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap'
      }}>
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Bold">
            <IconButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              color={editor.isActive('bold') ? 'primary' : 'default'}
              size="small"
            >
              <BoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Italic">
            <IconButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              color={editor.isActive('italic') ? 'primary' : 'default'}
              size="small"
            >
              <ItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Underline">
            <IconButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              color={editor.isActive('underline') ? 'primary' : 'default'}
              size="small"
            >
              <UnderlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Bullet List">
            <IconButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              color={editor.isActive('bulletList') ? 'primary' : 'default'}
              size="small"
            >
              <BulletListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Numbered List">
            <IconButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              color={editor.isActive('orderedList') ? 'primary' : 'default'}
              size="small"
            >
              <NumberedListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        <Tooltip title="Add Link">
          <IconButton onClick={addLink} size="small">
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Add Image">
          <IconButton 
            onClick={handleImageUpload} 
            size="small"
            disabled={uploading}
          >
            {uploading ? (
              <CircularProgress size={16} />
            ) : (
              <ImageIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Undo">
            <span>
              <IconButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                size="small"
              >
                <UndoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Redo">
            <span>
              <IconButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                size="small"
              >
                <RedoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </ButtonGroup>
      </Box>

      {/* Error Alert */}
      {uploadError && (
        <Alert 
          severity="error" 
          onClose={() => setUploadError(null)}
          sx={{ m: 1 }}
        >
          {uploadError}
        </Alert>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </Box>
  );
};

export default TiptapEditor;
